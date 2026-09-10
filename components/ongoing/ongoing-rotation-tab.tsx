"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronsUp, ChevronsDown, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OngoingMatchCard } from "@/components/ongoing/ongoing-match-card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { canManageOngoingEvent, canRecordOngoingResult } from "@/lib/ongoing-permissions";
import { ROTATION_MOVERS, groupLabelKey, rotationMovement } from "@/lib/ongoing-rotation";
import API from "@/lib/api";
import { cn } from "@/lib/utils";
import type { OngoingEvent, OngoingRotationGroup, OngoingRotationRound } from "@/lib/types";
import { playerDisplayName } from "@/lib/player-name";

interface OngoingRotationTabProps {
  event: OngoingEvent;
}

export function OngoingRotationTab({ event }: OngoingRotationTabProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canManage = canManageOngoingEvent(user, event.createdByUserId);
  // Entrants may enter and correct results too; managing the tournament stays narrower.
  const canRecord = canRecordOngoingResult(user, event);
  const rotation = event.rotation;

  const advanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.ADVANCE_ONGOING_ROTATION(event.id), {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ongoing-event", event.id] });
      toast({ title: t("toast.rotationRoundGenerated"), variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: t("toast.rotationRoundFailed"), description: error.message, variant: "error" });
    },
  });

  if (!rotation || !rotation.currentRound) {
    return (
      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
        {t("ongoing.rotation.notStarted", { players: event.config.groupCount * 4 })}
      </p>
    );
  }

  const currentRound = rotation.rounds.find((round) => round.round === rotation.currentRound);
  const isLastRound = rotation.currentRound >= rotation.totalRounds;
  const canAdvance = canManage && !isLastRound && Boolean(currentRound?.isComplete);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" suppressHydrationWarning>
            {t("ongoing.rotation.roundOf", { round: rotation.currentRound, total: rotation.totalRounds })}
          </Badge>
          {rotation.isFinished && (
            <Badge suppressHydrationWarning>
              <Trophy className="mr-1 size-3" />
              {t("ongoing.rotation.finished")}
            </Badge>
          )}
        </div>

        {canManage && !isLastRound && (
          <div className="flex flex-col items-end gap-1">
            <Button
              size="sm"
              disabled={!canAdvance || advanceMutation.isPending}
              onClick={() => advanceMutation.mutate()}
            >
              <span suppressHydrationWarning>{t("ongoing.rotation.nextRound")}</span>
              <ArrowRight className="ml-1 size-4" />
            </Button>
            {!currentRound?.isComplete && (
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t("ongoing.rotation.finishRoundFirst")}
              </p>
            )}
          </div>
        )}
      </div>

      {rotation.isFinished && (
        <Card>
          <CardContent className="flex flex-col gap-2 p-4">
            <h3 className="text-sm font-medium" suppressHydrationWarning>
              {t("ongoing.rotation.finalStandings")}
            </h3>
            <ol className="flex flex-col gap-1 text-sm">
              {rotation.finalStandings.map((row) => (
                <li key={row.player.id} className="flex items-center gap-2">
                  <span className="w-6 text-right tabular-nums text-muted-foreground">{row.place}.</span>
                  <span className={cn(row.place <= 3 && "font-medium")}>{playerDisplayName(row.player)}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Newest round first: that is the one being played. */}
      {rotation.rounds
        .slice()
        .sort((one, two) => two.round - one.round)
        .map((round) => (
          <RotationRoundSection
            key={round.round}
            event={event}
            round={round}
            isCurrent={round.round === rotation.currentRound}
            isLastRound={round.round >= rotation.totalRounds}
            canEdit={canRecord}
          />
        ))}
    </div>
  );
}

interface RotationRoundSectionProps {
  event: OngoingEvent;
  round: OngoingRotationRound;
  isCurrent: boolean;
  isLastRound: boolean;
  canEdit: boolean;
}

function RotationRoundSection({ event, round, isCurrent, isLastRound, canEdit }: RotationRoundSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium" suppressHydrationWarning>
          {t("ongoing.rotation.round", { round: round.round })}
        </h3>
        {!round.isComplete && (
          <Badge variant="outline" suppressHydrationWarning>
            {t("ongoing.rotation.inProgress")}
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {round.groups.map((group) => (
          <RotationGroupCard
            key={group.groupIndex}
            event={event}
            round={round}
            group={group}
            groupCount={round.groups.length}
            showMovement={round.isComplete && !isLastRound}
            canEdit={canEdit && isCurrent}
          />
        ))}
      </div>
    </section>
  );
}

interface RotationGroupCardProps {
  event: OngoingEvent;
  round: OngoingRotationRound;
  group: OngoingRotationGroup;
  groupCount: number;
  showMovement: boolean;
  canEdit: boolean;
}

function RotationGroupCard({
  event,
  round,
  group,
  groupCount,
  showMovement,
  canEdit,
}: RotationGroupCardProps) {
  const { t } = useTranslation();

  const games = event.games.filter(
    (game) => game.phase === "rotation" && game.round === round.round && game.groupIndex === group.groupIndex,
  );

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <h4 className="text-sm font-medium" suppressHydrationWarning>
          {t(groupLabelKey(group.groupIndex, groupCount), { number: group.groupIndex + 1 })}
        </h4>

        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="py-1 pr-2 font-medium">#</th>
              <th className="py-1 pr-2 font-medium" suppressHydrationWarning>
                {t("ongoing.rotation.player")}
              </th>
              <th className="py-1 pr-2 text-right font-medium" suppressHydrationWarning>
                {t("ongoing.rotation.wins")}
              </th>
              <th className="py-1 text-right font-medium" suppressHydrationWarning>
                {t("ongoing.rotation.diff")}
              </th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((row) => {
              const movement = showMovement
                ? rotationMovement(row.place, group.groupIndex, groupCount)
                : "stay";
              return (
                <tr key={row.player.id} className="border-b last:border-0">
                  <td className="py-1 pr-2 tabular-nums text-muted-foreground">{row.place}</td>
                  <td className="py-1 pr-2">
                    <span className="flex items-center gap-1">
                      {playerDisplayName(row.player)}
                      {movement === "up" && <ChevronsUp className="size-3 text-success" />}
                      {movement === "down" && <ChevronsDown className="size-3 text-destructive" />}
                    </span>
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums">{row.wins}</td>
                  <td className="py-1 text-right tabular-nums">
                    {row.pointsDiff > 0 ? `+${row.pointsDiff}` : row.pointsDiff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {showMovement && groupCount > 1 && (
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.rotation.movementHint", { count: ROTATION_MOVERS })}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {games.map((game) => (
            <OngoingMatchCard
              key={game.id}
              game={game}
              side1Label={game.side1Players.map(playerDisplayName).join(" + ")}
              side2Label={game.side2Players.map(playerDisplayName).join(" + ")}
              canEdit={canEdit}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
