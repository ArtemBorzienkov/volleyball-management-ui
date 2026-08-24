"use client";

import { Fragment, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsAdmin } from "@/hooks/use-is-admin";
import API from "@/lib/api";
import { roundLabel } from "@/lib/ongoing-bracket";
import { isPlayed, teamName } from "@/lib/ongoing-standings";
import { cn } from "@/lib/utils";
import type { OngoingEvent, OngoingGame, OngoingTeam } from "@/lib/types";

interface OngoingBracketTabProps {
  event: OngoingEvent;
}

// Every refusal the backend raises (group stage incomplete, a group smaller than the qualifier
// count, a locked group result) arrives as a 409/400 whose body explains exactly why. Losing that
// text would leave the admin with an unavailable button and no reason.
async function requestJson(url: string, method: string, fallbackMessage: string): Promise<unknown> {
  const response = await fetch(url, { method });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: fallbackMessage }));
    throw new Error(body.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

interface BracketSlotRowProps {
  name: string | null;
  points: number | null;
  isWinner: boolean;
  isLoser: boolean;
}

function BracketSlotRow({ name, points, isWinner, isLoser }: BracketSlotRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      {name === null ? (
        <span className="truncate text-sm italic text-muted-foreground" suppressHydrationWarning>
          {t("ongoing.bracket.tbd")}
        </span>
      ) : (
        <span className={cn("truncate text-sm", isWinner && "font-semibold", isLoser && "text-muted-foreground")}>
          {name}
        </span>
      )}
      <span className="shrink-0 text-sm tabular-nums">{points === null ? "—" : points}</span>
    </div>
  );
}

interface BracketGameBoxProps {
  game: OngoingGame;
  team1: OngoingTeam | undefined;
  team2: OngoingTeam | undefined;
  canEdit: boolean;
  onEdit: () => void;
}

function BracketGameBox({ game, team1, team2, canEdit, onEdit }: BracketGameBoxProps) {
  const { t } = useTranslation();
  const played = isPlayed(game);
  const team1Won = played && (game.team1Points as number) > (game.team2Points as number);
  const bothSlotsFilled = Boolean(team1 && team2);

  return (
    <div className="w-56 shrink-0 overflow-hidden rounded-md border bg-card">
      <BracketSlotRow
        name={team1 ? teamName(team1) : null}
        points={game.team1Points}
        isWinner={played && team1Won}
        isLoser={played && !team1Won}
      />
      <div className="border-t" />
      <BracketSlotRow
        name={team2 ? teamName(team2) : null}
        points={game.team2Points}
        isWinner={played && !team1Won}
        isLoser={played && team1Won}
      />
      {canEdit && bothSlotsFilled ? (
        <div className="flex justify-end border-t bg-muted/40 px-1 py-0.5">
          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            <span className="text-xs" suppressHydrationWarning>
              {played ? t("ongoing.bracket.editResult") : t("ongoing.bracket.enterResult")}
            </span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface BracketConnectorProps {
  // How many games the earlier (feeding) round has — always a power of two, so always even here.
  gameCount: number;
}

// Pure-math bracket lines, no DOM measurement: both this round's column and the next one lay their
// boxes out with `justify-around` over the same shared height, so box i's vertical center in a
// column of N boxes sits at (i + 0.5) / N of that height — true for either round, which is what
// lets a percentage-based SVG connect them without ever reading a rendered box's actual position.
function BracketConnector({ gameCount }: BracketConnectorProps) {
  if (gameCount < 2 || gameCount % 2 !== 0) return null;

  const pairs = Array.from({ length: gameCount / 2 }, (_, i) => i);

  return (
    <svg
      className="w-6 shrink-0 flex-1 text-border"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {pairs.map((i) => {
        const topY = ((2 * i + 0.5) / gameCount) * 100;
        const bottomY = ((2 * i + 1.5) / gameCount) * 100;
        const midY = (topY + bottomY) / 2;

        return (
          <g key={i} stroke="currentColor" fill="none">
            <line x1={0} y1={topY} x2={50} y2={topY} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={bottomY} x2={50} y2={bottomY} vectorEffect="non-scaling-stroke" />
            <line x1={50} y1={topY} x2={50} y2={bottomY} vectorEffect="non-scaling-stroke" />
            <line x1={50} y1={midY} x2={100} y2={midY} vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
    </svg>
  );
}

interface BracketResultDialogProps {
  game: OngoingGame;
  team1Name: string;
  team2Name: string;
  onClose: () => void;
}

function BracketResultDialog({ game, team1Name, team2Name, onClose }: BracketResultDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [points1, setPoints1] = useState(game.team1Points === null ? "" : String(game.team1Points));
  const [points2, setPoints2] = useState(game.team2Points === null ? "" : String(game.team2Points));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ongoing-event", game.eventId] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.UPDATE_ONGOING_GAME(game.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1Points: Number(points1), team2Points: Number(points2) }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: t("ongoing.bracket.requestFailed") }));
        throw new Error(body.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  const clearMutation = useMutation({
    mutationFn: () =>
      requestJson(API.CLEAR_ONGOING_GAME_RESULT(game.id), "DELETE", t("ongoing.bracket.requestFailed")),
    onSuccess: () => {
      invalidate();
      onClose();
    },
  });

  const trimmed1 = points1.trim();
  const trimmed2 = points2.trim();
  const parsed1 = Number(trimmed1);
  const parsed2 = Number(trimmed2);
  const isScoreValid =
    trimmed1 !== "" &&
    trimmed2 !== "" &&
    Number.isInteger(parsed1) &&
    Number.isInteger(parsed2) &&
    parsed1 >= 0 &&
    parsed2 >= 0 &&
    parsed1 !== parsed2;

  return (
    <Dialog open onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t("ongoing.bracket.resultTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <span className="flex-1 text-right text-sm font-medium">{team1Name}</span>
          <div className="flex items-center gap-2">
            <Input
              className="w-16 text-center"
              inputMode="numeric"
              aria-label={team1Name}
              value={points1}
              onChange={(changeEvent) => setPoints1(changeEvent.target.value)}
            />
            <span className="text-muted-foreground">:</span>
            <Input
              className="w-16 text-center"
              inputMode="numeric"
              aria-label={team2Name}
              value={points2}
              onChange={(changeEvent) => setPoints2(changeEvent.target.value)}
            />
          </div>
          <span className="flex-1 text-sm font-medium">{team2Name}</span>
        </div>

        {!isScoreValid && (points1 !== "" || points2 !== "") && (
          <p className="text-center text-xs text-destructive" suppressHydrationWarning>
            {t("ongoing.bracket.invalidScore")}
          </p>
        )}
        {saveMutation.isError && (
          <p className="text-center text-sm text-destructive">{(saveMutation.error as Error).message}</p>
        )}
        {clearMutation.isError && (
          <p className="text-center text-sm text-destructive">{(clearMutation.error as Error).message}</p>
        )}

        <DialogFooter>
          {isPlayed(game) ? (
            <Button
              variant="outline"
              disabled={clearMutation.isPending}
              onClick={() => {
                if (window.confirm(t("ongoing.bracket.clearConfirm"))) clearMutation.mutate();
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span suppressHydrationWarning>{t("ongoing.bracket.clear")}</span>
            </Button>
          ) : null}
          <Button disabled={!isScoreValid || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            <Check className="mr-2 h-4 w-4" />
            <span suppressHydrationWarning>{t("ongoing.bracket.save")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OngoingBracketTab({ event }: OngoingBracketTabProps) {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ongoing-event", event.id] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
  };

  const generateMutation = useMutation({
    mutationFn: () =>
      requestJson(API.GENERATE_ONGOING_PLAYOFF(event.id), "POST", t("ongoing.bracket.requestFailed")),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      requestJson(API.DELETE_ONGOING_PLAYOFF(event.id), "DELETE", t("ongoing.bracket.requestFailed")),
    onSuccess: () => {
      setIsDeleteConfirmOpen(false);
      invalidate();
    },
  });

  const teamsById = new Map(event.teams.map((team) => [team.id, team]));
  const groupGames = event.games.filter((game) => game.phase === "group");
  const playoffGames = event.games.filter((game) => game.phase === "playoff");

  // Rule 1: a tournament with no group games has not completed a group stage.
  const isGroupStageComplete = groupGames.length > 0 && groupGames.every(isPlayed);
  const hasPlayoff = playoffGames.length > 0;

  // The 3rd-place row has no bracketRound (it doesn't fit the round-column layout) and is
  // rendered separately, as its own column next to the final.
  const thirdPlaceGame = playoffGames.find((game) => game.thirdPlace) ?? null;
  const bracketGames = playoffGames.filter((game) => !game.thirdPlace);

  const gamesByRound = new Map<number, OngoingGame[]>();
  for (const game of bracketGames) {
    if (game.bracketRound === null) continue;
    const list = gamesByRound.get(game.bracketRound) ?? [];
    list.push(game);
    gamesByRound.set(game.bracketRound, list);
  }
  for (const list of gamesByRound.values()) {
    list.sort((a, b) => (a.bracketSlot ?? 0) - (b.bracketSlot ?? 0));
  }
  const roundNumbers = Array.from(gamesByRound.keys()).sort((a, b) => a - b);
  const totalRounds = roundNumbers.length ? roundNumbers[roundNumbers.length - 1] : 0;

  const editingGame = playoffGames.find((game) => game.id === editingGameId) ?? null;
  const editingTeam1 = editingGame?.team1Id ? teamsById.get(editingGame.team1Id) : undefined;
  const editingTeam2 = editingGame?.team2Id ? teamsById.get(editingGame.team2Id) : undefined;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.bracket.bracketTitle")}
          </h2>

          {isAdmin && hasPlayoff ? (
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              <span suppressHydrationWarning>{t("ongoing.bracket.delete")}</span>
            </Button>
          ) : null}

          {isAdmin && !hasPlayoff && isGroupStageComplete ? (
            <Button disabled={generateMutation.isPending} onClick={() => generateMutation.mutate()}>
              <span suppressHydrationWarning>{t("ongoing.bracket.generate")}</span>
            </Button>
          ) : null}
        </div>

        {generateMutation.isError && (
          <p className="text-sm text-destructive">{(generateMutation.error as Error).message}</p>
        )}
        {deleteMutation.isError && (
          <p className="text-sm text-destructive">{(deleteMutation.error as Error).message}</p>
        )}

        {!hasPlayoff ? (
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {isGroupStageComplete ? t("ongoing.bracket.empty") : t("ongoing.bracket.groupStageIncomplete")}
          </p>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-stretch gap-0">
              {roundNumbers.map((round, index) => {
                const gamesInRound = gamesByRound.get(round) ?? [];

                return (
                  <Fragment key={round}>
                    <div className="flex flex-col gap-3 px-2">
                      <h3
                        className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {roundLabel(t, round, totalRounds)}
                      </h3>
                      <div className="flex flex-1 flex-col justify-around gap-3">
                        {gamesInRound.map((game) => (
                          <BracketGameBox
                            key={game.id}
                            game={game}
                            team1={game.team1Id ? teamsById.get(game.team1Id) : undefined}
                            team2={game.team2Id ? teamsById.get(game.team2Id) : undefined}
                            canEdit={isAdmin}
                            onEdit={() => setEditingGameId(game.id)}
                          />
                        ))}
                      </div>
                    </div>
                    {index < roundNumbers.length - 1 ? (
                      <div className="flex flex-col gap-3">
                        {/* Invisible twin of the round heading above, so the connector's own
                            flex-1 box starts at the same y-offset as the round columns' boxes —
                            matching classes rather than a guessed pixel offset keeps this correct
                            if the heading's font size or line height ever changes. */}
                        <h3 className="text-center text-xs font-semibold uppercase tracking-wider invisible" aria-hidden="true">
                          &nbsp;
                        </h3>
                        <BracketConnector gameCount={gamesInRound.length} />
                      </div>
                    ) : null}
                  </Fragment>
                );
              })}
              {thirdPlaceGame ? (
                <div className="flex flex-col gap-3 pl-6">
                  <h3
                    className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {t("ongoing.bracket.thirdPlace")}
                  </h3>
                  <div className="flex flex-1 flex-col justify-around gap-3">
                    <BracketGameBox
                      game={thirdPlaceGame}
                      team1={thirdPlaceGame.team1Id ? teamsById.get(thirdPlaceGame.team1Id) : undefined}
                      team2={thirdPlaceGame.team2Id ? teamsById.get(thirdPlaceGame.team2Id) : undefined}
                      canEdit={isAdmin}
                      onEdit={() => setEditingGameId(thirdPlaceGame.id)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {editingGame && editingTeam1 && editingTeam2 ? (
        <BracketResultDialog
          key={editingGame.id}
          game={editingGame}
          team1Name={teamName(editingTeam1)}
          team2Name={teamName(editingTeam2)}
          onClose={() => setEditingGameId(null)}
        />
      ) : null}

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t("ongoing.bracket.deleteConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.bracket.deleteConfirm")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              <span suppressHydrationWarning>{t("ongoing.bracket.cancel")}</span>
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              <span suppressHydrationWarning>{t("ongoing.bracket.confirmDelete")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
