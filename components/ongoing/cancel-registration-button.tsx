"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { canCancelOngoingEntry } from "@/lib/ongoing-permissions";
import { useToast } from "@/components/ui/toast";
import API from "@/lib/api";
import type { OngoingOpenEvent } from "@/lib/types";

interface CancelRegistrationButtonProps {
  event: OngoingOpenEvent;
}

export function CancelRegistrationButton({ event }: CancelRegistrationButtonProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const playerId = user?.playerId ?? null;
  const ownTeam = playerId
    ? event.teams.find((team) => team.player1.id === playerId || team.player2.id === playerId)
    : undefined;
  const ownSolo = playerId ? event.soloPlayers.find((solo) => solo.player.id === playerId) : undefined;

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const url = ownTeam ? API.REMOVE_ONGOING_TEAM(ownTeam.id) : API.REMOVE_ONGOING_SOLO(ownSolo!.id);
      const response = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-event", event.id] });
      toast({ title: t("toast.registrationCancelled"), description: event.name, variant: "success" });
    },
    onError: (error: Error) => {
      toast({ title: t("toast.cancellationFailed"), description: error.message, variant: "error" });
    },
  });

  if (!ownTeam && !ownSolo) return null;

  const entryPlayerIds = ownTeam ? [ownTeam.player1.id, ownTeam.player2.id] : [ownSolo!.player.id];

  if (!canCancelOngoingEntry(user, event, entryPlayerIds)) {
    return (
      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
        {t("calendar.cancelClosed")}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={cancelMutation.isPending}
        onClick={() => {
          // window.confirm matches how ongoing-roster-section already confirms a team removal.
          const message = ownTeam ? t("calendar.cancelTeamConfirm") : t("calendar.cancelSoloConfirm");
          if (window.confirm(message)) cancelMutation.mutate();
        }}
      >
        <span suppressHydrationWarning>{t("calendar.cancelRegistration")}</span>
      </Button>
      {cancelMutation.isError && <p className="text-xs text-destructive">{(cancelMutation.error as Error).message}</p>}
    </div>
  );
}
