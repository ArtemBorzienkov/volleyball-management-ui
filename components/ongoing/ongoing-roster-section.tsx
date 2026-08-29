"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import API from "@/lib/api";
import { isPlayed } from "@/lib/ongoing-standings";
import type { OngoingEvent, Player } from "@/lib/types";
import { TeamRosterEditor, type TeamDraft } from "@/components/ongoing/team-roster-editor";
import { SoloPoolSection } from "@/components/ongoing/solo-pool-section";
import { useToast } from "@/components/ui/toast";

interface OngoingRosterSectionProps {
  event: OngoingEvent;
  players: Player[];
}

// The team ids in order. The parent passes this as `key`, so any server-side roster change — an
// admin delete here, or a public self-registration from /calendar — remounts this component and
// throws away the draft. Losing an in-progress draft is the deliberate trade-off: a stale draft
// re-submitted through PUT /teams would recreate deleted teams or silently delete new registrations.
export function rosterSignature(event: OngoingEvent): string {
  // Solo ids are included for the same reason team ids are: a solo registration arriving while the
  // admin has a draft open must remount the editor rather than let a stale draft be re-submitted.
  return [...event.teams.map((team) => team.id), ...event.soloPlayers.map((solo) => solo.id)].join(",");
}

async function putJson(url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function OngoingRosterSection({ event, players }: OngoingRosterSectionProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [teams, setTeams] = useState<TeamDraft[]>(
    event.teams.map((team) => ({ player1Id: team.player1.id, player2Id: team.player2.id })),
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isTeamsConfirmOpen, setIsTeamsConfirmOpen] = useState(false);

  // A tournament leaves planning the moment any match has a recorded score; a generated-but-unplayed
  // schedule still counts as planning. Derived on every render, never stored.
  const hasStarted = event.games.some(isPlayed);

  // The list page reads its Teams/Matches/Played counters from a separate query and /calendar reads
  // the open-for-registration list, so both have to be refreshed alongside the detail query.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ongoing-event", event.id] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
  };

  const removeTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await fetch(API.REMOVE_ONGOING_TEAM(teamId), { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
    },
    onSuccess: invalidate,
  });

  const saveTeamsMutation = useMutation({
    mutationFn: () =>
      putJson(API.SET_ONGOING_TEAMS(event.id), {
        teams: teams.filter((team) => team.player1Id && team.player2Id),
      }),
    onSuccess: () => {
      setIsTeamsConfirmOpen(false);
      invalidate();
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.GENERATE_ONGOING_SCHEDULE(event.id), { method: "POST", credentials: "include" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setIsConfirmOpen(false);
      invalidate();
      toast({ title: t("toast.scheduleGenerated"), variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: t("toast.scheduleFailed"), description: error.message, variant: "error" });
    },
  });

  const hasIncompleteTeam = teams.some((team) => !team.player1Id || !team.player2Id);

  // The schedule is built from the persisted roster, so both gates below read the server copy, never the draft.
  const hasEnoughTeams = event.teams.length >= 2;
  const hasUnsavedTeams =
    teams.length !== event.teams.length ||
    teams.some(
      (team, index) =>
        team.player1Id !== event.teams[index].player1.id || team.player2Id !== event.teams[index].player2.id,
    );

  return (
    <>
      <SoloPoolSection event={event} players={players} disabled={hasStarted} />

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <p className="font-medium" suppressHydrationWarning>
            {t("ongoing.config.teamsTitle")}
          </p>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.config.teamsHint")}
          </p>

          {hasStarted && (
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t("ongoing.config.rosterLocked")}
            </p>
          )}

          {!hasStarted && event.teams.length > 0 && (
            <div className="flex flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-muted-foreground" suppressHydrationWarning>
                {t("ongoing.config.registeredTeamsTitle")}
              </p>
              {event.teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {team.player1.name} / {team.player2.name}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(t("ongoing.config.removeTeamConfirm"))) removeTeamMutation.mutate(team.id);
                    }}
                    disabled={removeTeamMutation.isPending}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    <span suppressHydrationWarning>{t("ongoing.config.removeRegisteredTeam")}</span>
                  </Button>
                </div>
              ))}
              {removeTeamMutation.isError && (
                <p className="text-sm text-destructive">{(removeTeamMutation.error as Error).message}</p>
              )}
            </div>
          )}

          <TeamRosterEditor teams={teams} players={players} onChange={setTeams} disabled={hasStarted} />

          {!hasStarted && hasIncompleteTeam && (
            <p className="text-sm text-destructive" suppressHydrationWarning>
              {t("ongoing.config.incompleteTeam")}
            </p>
          )}

          {!hasStarted && saveTeamsMutation.isError && (
            <p className="text-sm text-destructive">{(saveTeamsMutation.error as Error).message}</p>
          )}

          {!hasStarted && (
            <Button
              className="self-start"
              onClick={() => (event.games.length ? setIsTeamsConfirmOpen(true) : saveTeamsMutation.mutate())}
              disabled={hasIncompleteTeam || saveTeamsMutation.isPending}
            >
              <span suppressHydrationWarning>{t("ongoing.config.saveTeams")}</span>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          {!hasEnoughTeams && (
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t("ongoing.config.needTeams")}
            </p>
          )}
          {hasEnoughTeams && hasUnsavedTeams && (
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t("ongoing.config.unsavedTeams")}
            </p>
          )}
          <Button
            className="self-start"
            disabled={!hasEnoughTeams || hasUnsavedTeams || generateMutation.isPending}
            onClick={() => (event.games.length ? setIsConfirmOpen(true) : generateMutation.mutate())}
          >
            <span suppressHydrationWarning>{t("ongoing.config.generate")}</span>
          </Button>
          {generateMutation.isError && (
            <p className="text-sm text-destructive">{(generateMutation.error as Error).message}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t("ongoing.config.generateConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.config.generateConfirm")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              <span suppressHydrationWarning>{t("ongoing.config.cancel")}</span>
            </Button>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              <span suppressHydrationWarning>{t("ongoing.config.confirm")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTeamsConfirmOpen} onOpenChange={setIsTeamsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t("ongoing.config.saveTeamsConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.config.saveTeamsConfirm")}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamsConfirmOpen(false)}>
              <span suppressHydrationWarning>{t("ongoing.config.cancel")}</span>
            </Button>
            <Button onClick={() => saveTeamsMutation.mutate()} disabled={saveTeamsMutation.isPending}>
              <span suppressHydrationWarning>{t("ongoing.config.saveTeamsConfirmAction")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
