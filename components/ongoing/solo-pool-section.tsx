"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPlayerInlineForm } from "@/components/ongoing/new-player-inline";
import { SelectInput } from "@/components/ui/select-input";
import { useToast } from "@/components/ui/toast";
import API from "@/lib/api";
import type { OngoingEvent, OngoingSoloPairPreview, Player } from "@/lib/types";
import { playerDisplayName } from "@/lib/player-name";

interface SoloPoolSectionProps {
  event: OngoingEvent;
  players: Player[];
  disabled: boolean;
}

interface DraftPair {
  player1Id: string;
  player2Id: string;
}

// The preview arrives as players; the dialog edits ids and looks names back up, so a swap is a
// one-field change rather than a rebuild of the pair objects.
function toDraft(preview: OngoingSoloPairPreview): DraftPair[] {
  return preview.pairs.map((pair) => ({ player1Id: pair.player1.id, player2Id: pair.player2.id }));
}

export function SoloPoolSection({ event, players, disabled }: SoloPoolSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [draft, setDraft] = useState<DraftPair[]>([]);
  const [newSoloPlayerId, setNewSoloPlayerId] = useState("");
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);
  // Players created inline this session, merged into the select below so the freshly created one is
  // selectable immediately rather than after the ["players"] refetch lands.
  const [createdPlayers, setCreatedPlayers] = useState<Player[]>([]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ongoing-event", event.id] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
  };

  const nameOf = (playerId: string) =>
    event.soloPlayers.find((solo) => solo.player.id === playerId)?.player.name ?? playerId;
  const ratingOf = (playerId: string) => event.soloPlayers.find((solo) => solo.player.id === playerId)?.rating ?? 0;

  const previewMutation = useMutation({
    mutationFn: async (): Promise<OngoingSoloPairPreview> => {
      const response = await fetch(API.GET_ONGOING_SOLO_PREVIEW(event.id), { credentials: "include" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (preview) => {
      setDraft(toDraft(preview));
      setIsPreviewOpen(true);
    },
  });

  const formTeamsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.FORM_ONGOING_TEAMS(event.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teams: draft }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      const leftoverCount = leftoverIds.length;
      setIsPreviewOpen(false);
      setDraft([]);
      invalidate();
      toast(
        leftoverCount
          ? { title: t("toast.teamsFormed"), description: t("toast.teamsFormedLeftover"), variant: "warning" }
          : { title: t("toast.teamsFormed"), variant: "success" },
      );
    },
    onError: (error: Error) => {
      toast({ title: t("toast.teamsFormFailed"), description: error.message, variant: "error" });
    },
  });

  // The creator adds a lone entrant through the same endpoint a player self-registers with — the
  // backend takes playerId only from a manager, and refuses it when the tournament has solo off.
  const addSoloMutation = useMutation({
    mutationFn: async (playerId: string) => {
      const response = await fetch(API.ADD_ONGOING_SOLO(event.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ playerId }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setNewSoloPlayerId("");
      invalidate();
      toast({ title: t("toast.playerAdded"), variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: t("toast.registrationFailed"), description: error.message, variant: "error" });
    },
  });

  const removeSoloMutation = useMutation({
    mutationFn: async (soloId: string) => {
      const response = await fetch(API.REMOVE_ONGOING_SOLO(soloId), { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
    },
    onSuccess: () => {
      invalidate();
      toast({ title: t("toast.playerRemoved"), variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: t("toast.cancellationFailed"), description: error.message, variant: "error" });
    },
  });

  // One entry per player per tournament, so anyone already on the roster or in the pool is out.
  const takenPlayerIds = new Set([
    ...event.teams.flatMap((team) => [team.player1.id, team.player2.id]),
    ...event.soloPlayers.map((solo) => solo.player.id),
  ]);
  const knownPlayerIds = new Set(players.map((player) => player.id));
  const allPlayers = [...players, ...createdPlayers.filter((player) => !knownPlayerIds.has(player.id))];
  const eligiblePlayers = allPlayers.filter((player) => !takenPlayerIds.has(player.id));

  const draftPlayerIds = draft.flatMap((pair) => [pair.player1Id, pair.player2Id]);
  const leftoverIds = event.soloPlayers
    .map((solo) => solo.player.id)
    .filter((playerId) => !draftPlayerIds.includes(playerId));

  const setSlot = (index: number, slot: "player1Id" | "player2Id", playerId: string) => {
    setDraft((previous) =>
      previous.map((pair, pairIndex) => (pairIndex === index ? { ...pair, [slot]: playerId } : pair)),
    );
  };

  // Every pool member is offered; only the id already in the pair's other slot is excluded, because
  // the backend rejects a player repeated across teams outright.
  const renderSlot = (index: number, slot: "player1Id" | "player2Id") => {
    const pair = draft[index];
    const otherId = slot === "player1Id" ? pair.player2Id : pair.player1Id;

    return (
      <SelectInput
        className="flex-1"
        name={`solo-pair-${index}-${slot}`}
        value={pair[slot]}
        onChange={(playerId) => setSlot(index, slot, playerId)}
        options={event.soloPlayers
          .filter((solo) => solo.player.id !== otherId)
          .map((solo) => ({ value: solo.player.id, label: solo.player.name, subtitle: String(solo.rating) }))}
      />
    );
  };

  // Nothing to say when the tournament does not take partnerless entrants and none are waiting.
  const isFullRotation = event.config.scheme === "fullRotation";

  if (!event.config.allowSoloRegistration && !event.soloPlayers.length) return null;

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <p className="font-medium" suppressHydrationWarning>
            {isFullRotation ? t("calendar.participants") : t("ongoing.config.solo.title")}
          </p>

          {event.soloPlayers.length === 0 && (
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {isFullRotation ? t("ongoing.config.solo.emptyRotation") : t("ongoing.config.solo.empty")}
            </p>
          )}

          {event.soloPlayers.map((solo) => (
            <div key={solo.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {playerDisplayName(solo.player)} <span className="text-muted-foreground">{solo.rating}</span>
              </span>
              <Button
                variant="destructive"
                size="sm"
                disabled={disabled || removeSoloMutation.isPending}
                onClick={() => removeSoloMutation.mutate(solo.id)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                <span suppressHydrationWarning>{t("ongoing.config.solo.remove")}</span>
              </Button>
            </div>
          ))}

          {removeSoloMutation.isError && (
            <p className="text-sm text-destructive">{(removeSoloMutation.error as Error).message}</p>
          )}

          {event.config.allowSoloRegistration && !disabled && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t("ongoing.config.solo.addPlayerHint")}
              </p>
              <div className="flex items-center gap-2">
                <SelectInput
                  className="flex-1"
                  name="solo-add-player"
                  placeholder={t("ongoing.config.selectPlayer")}
                  value={newSoloPlayerId}
                  onChange={setNewSoloPlayerId}
                  options={eligiblePlayers.map((player) => ({ value: player.id, label: player.name }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setIsCreatingPlayer(true)}
                  disabled={isCreatingPlayer}
                  aria-label={t("calendar.addNewPlayer")}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!newSoloPlayerId || addSoloMutation.isPending}
                  onClick={() => addSoloMutation.mutate(newSoloPlayerId)}
                >
                  <span suppressHydrationWarning>{t("ongoing.config.solo.addPlayer")}</span>
                </Button>
              </div>

              {isCreatingPlayer && (
                <NewPlayerInlineForm
                  onCreated={(player) => {
                    // Selected, not registered: the admin still confirms with "Add player", the same
                    // two-step the team roster editor uses.
                    setCreatedPlayers((previous) => [...previous, player]);
                    setNewSoloPlayerId(player.id);
                    setIsCreatingPlayer(false);
                  }}
                  onCancel={() => setIsCreatingPlayer(false)}
                />
              )}
              {addSoloMutation.isError && (
                <p className="text-sm text-destructive">{(addSoloMutation.error as Error).message}</p>
              )}
            </div>
          )}

          {/* Not offered for fullRotation: pairing the pool into fixed teams is the opposite of a
              format whose whole point is a different partner every game. */}
          {!isFullRotation && event.soloPlayers.length >= 2 && (
            <Button
              className="self-start"
              disabled={disabled || previewMutation.isPending}
              onClick={() => previewMutation.mutate()}
            >
              <span suppressHydrationWarning>{t("ongoing.config.solo.formTeams")}</span>
            </Button>
          )}

          {previewMutation.isError && (
            <p className="text-sm text-destructive">{(previewMutation.error as Error).message}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t("ongoing.config.solo.previewTitle")}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.config.solo.previewHint")}
          </p>

          <div className="flex flex-col gap-2">
            {draft.map((pair, index) => (
              <div key={index} className="flex items-center gap-2">
                {renderSlot(index, "player1Id")}
                <span className="text-muted-foreground">+</span>
                {renderSlot(index, "player2Id")}
                <span className="w-14 text-right text-sm text-muted-foreground">
                  {ratingOf(pair.player1Id) + ratingOf(pair.player2Id)}
                </span>
              </div>
            ))}
          </div>

          {leftoverIds.length > 0 && (
            <div className="flex flex-col gap-1 rounded-md border border-input p-3 text-sm">
              <span className="text-muted-foreground" suppressHydrationWarning>
                {t("ongoing.config.solo.unpaired")}
              </span>
              {leftoverIds.map((playerId) => (
                <span key={playerId}>{nameOf(playerId)}</span>
              ))}
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t("ongoing.config.solo.oddWarning")}
              </span>
            </div>
          )}

          {formTeamsMutation.isError && (
            <p className="text-sm text-destructive">{(formTeamsMutation.error as Error).message}</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              <span suppressHydrationWarning>{t("ongoing.config.solo.cancel")}</span>
            </Button>
            <Button onClick={() => formTeamsMutation.mutate()} disabled={!draft.length || formTeamsMutation.isPending}>
              <span suppressHydrationWarning>{t("ongoing.config.solo.confirm")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
