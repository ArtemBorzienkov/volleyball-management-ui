"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { SelectInput } from "@/components/ui/select-input";
import { NewPlayerInlineForm } from "@/components/ongoing/new-player-inline";
import { LoginRequiredDialog } from "@/components/auth/login-required-dialog";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";
import {
  canRegisterInOngoingEvent,
  isOngoingEventFull,
  isSoloOnlyOngoingEvent,
  ongoingEntrantPlayerIds,
} from "@/lib/ongoing-permissions";
import API from "@/lib/api";
import type { OngoingOpenEvent, Player } from "@/lib/types";

interface RegisterTeamDialogProps {
  event: OngoingOpenEvent;
  players: Player[];
}

export function RegisterTeamDialog({ event, players }: RegisterTeamDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [player2Id, setPlayer2Id] = useState("");
  // fullRotation has no pairs to register: everyone enters alone and is grouped by rating. A
  // solo-only tournament of any other scheme enters the same way — the organiser forms the teams.
  const isFullRotation = event.scheme === "fullRotation";
  const isSoloOnly = isSoloOnlyOngoingEvent(event);
  const [mode, setMode] = useState<"partner" | "solo">(isSoloOnly ? "solo" : "partner");

  // Players created inline this session, merged in below so the slot that triggered creation
  // can show and select them immediately, without waiting on the ["players"] refetch.
  const [createdPlayers, setCreatedPlayers] = useState<Player[]>([]);
  const [isCreatingPlayer, setIsCreatingPlayer] = useState(false);

  const knownPlayerIds = new Set(players.map((player) => player.id));
  const allPlayers = [...players, ...createdPlayers.filter((player) => !knownPlayerIds.has(player.id))];

  // Everyone already entered in this event — on a roster OR waiting in the solo pool. The pool half
  // used to be missing here, so a partnerless entrant could be picked as a partner and the API
  // answered 409 on submit instead of the name simply not being offered.
  const registeredIds = new Set([
    ...event.teams.flatMap((team) => [team.player1.id, team.player2.id]),
    ...event.soloPlayers.map((solo) => solo.player.id),
  ]);
  const availablePlayers = allPlayers.filter((player) => !registeredIds.has(player.id));

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.ADD_ONGOING_TEAM(event.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ player1Id: user?.playerId, player2Id: player2Id }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
      // Registering then clicking through to the detail page must not show a roster without the new team.
      queryClient.invalidateQueries({ queryKey: ["ongoing-event", event.id] });
      toast({ title: t("toast.teamRegistered"), description: event.name, variant: "success" });
      // Not a user-driven dismissal, so onOpenChange never fires — go through the same reset
      // path a manual close uses, or the inline create-player row survives into the next open.
      resetAndSetOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: t("toast.registrationFailed"), description: error.message, variant: "error" });
    },
  });

  const registerSoloMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.ADD_ONGOING_SOLO(event.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // Empty body: the backend takes the caller's own playerId, so the client never asserts who it is.
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-event", event.id] });
      toast({ title: t("toast.soloRegistered"), description: event.name, variant: "success" });
      resetAndSetOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: t("toast.registrationFailed"), description: error.message, variant: "error" });
    },
  });

  const resetAndSetOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPlayer2Id("");
      setMode(isSoloOnly ? "solo" : "partner");
      setCreatedPlayers([]);
      setIsCreatingPlayer(false);
      registerMutation.reset();
      registerSoloMutation.reset();
    }
  };

  const canRegister = Boolean(user?.playerId) && Boolean(player2Id) && user?.playerId !== player2Id;

  const isAlreadyEntered = Boolean(user?.playerId && ongoingEntrantPlayerIds(event).has(user.playerId));

  const renderPartnerField = () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <SelectInput
          className="flex-1"
          name="partner"
          label={t("calendar.player2")}
          placeholder={t("ongoing.config.selectPlayer")}
          value={player2Id}
          onChange={setPlayer2Id}
          options={availablePlayers
            .filter((player) => player.id !== user?.playerId)
            .map((player) => ({ value: player.id, label: player.name }))}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="mb-0.5"
          onClick={() => setIsCreatingPlayer(true)}
          disabled={isCreatingPlayer}
          aria-label={t("calendar.addNewPlayer")}
        >
          <Plus className="size-4" />
        </Button>
      </div>

      {isCreatingPlayer && (
        <NewPlayerInlineForm
          onCreated={(player) => {
            setCreatedPlayers((previous) => [...previous, player]);
            setPlayer2Id(player.id);
            setIsCreatingPlayer(false);
          }}
          onCancel={() => setIsCreatingPlayer(false)}
        />
      )}
    </div>
  );

  // Nothing to offer someone who is already in: the cancel control alongside this one is their
  // action now. Checked before every other branch — being entered settles the question regardless of
  // whether the tournament is full, private, or under way.
  if (isAlreadyEntered) return null;

  // Both of these come before the remaining branches: nobody can register, logged in or not, and
  // saying why is more use than a disabled button. The calendar lists these tournaments so people
  // can follow them — see findOpen.
  if (event.hasStarted) {
    return (
      <Badge variant="secondary" title={t("calendar.inProgressHint")}>
        <span suppressHydrationWarning>{t("calendar.inProgressBadge")}</span>
      </Badge>
    );
  }

  if (event.registrationOpen === false) {
    return (
      <Badge variant="outline" title={t("calendar.registrationClosedHint")}>
        <span suppressHydrationWarning>{t("calendar.registrationClosedBadge")}</span>
      </Badge>
    );
  }

  if (isOngoingEventFull(event)) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-block">
            <Button size="sm" disabled>
              <span suppressHydrationWarning>{t("calendar.noSpots")}</span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent suppressHydrationWarning>{t("calendar.noSpotsHint")}</TooltipContent>
      </Tooltip>
    );
  }

  if (!user) {
    return (
      <>
        {/* Enabled on purpose: a disabled button with a tooltip left a logged-out visitor to work
            out what to do next. Clicking asks for the login it needs and then carries on. */}
        <Button size="sm" onClick={() => setIsLoginPromptOpen(true)}>
          <span suppressHydrationWarning>{t("calendar.register")}</span>
        </Button>
        <LoginRequiredDialog
          open={isLoginPromptOpen}
          onOpenChange={setIsLoginPromptOpen}
          notice={t("auth.loginToJoin")}
          // The registration dialog only exists past this guard, so opening it here relies on `open`
          // surviving the re-render that the fresh ["me"] query triggers.
          onAuthenticated={() => setOpen(true)}
        />
      </>
    );
  }

  // Below the !user guard on purpose: a logged-out visitor still gets the "log in first" tooltip
  // rather than a bare Private badge.
  if (!canRegisterInOngoingEvent(user, event)) {
    return (
      <Badge variant="secondary" title={t("calendar.privateHint")}>
        <span suppressHydrationWarning>{t("calendar.privateBadge")}</span>
      </Badge>
    );
  }


  return (
    <Dialog open={open} onOpenChange={resetAndSetOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <span suppressHydrationWarning>{t("calendar.register")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>
            {isSoloOnly ? t("calendar.registerSoloTitle") : t("calendar.registerTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {event.allowSoloRegistration && !isSoloOnly && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "partner" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("partner")}
              >
                <span suppressHydrationWarning>{t("calendar.modeWithPartner")}</span>
              </Button>
              <Button
                type="button"
                variant={mode === "solo" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("solo")}
              >
                <span suppressHydrationWarning>{t("calendar.modeSolo")}</span>
              </Button>
            </div>
          )}

          {mode === "partner" && availablePlayers.length === 0 && (
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t("calendar.noPlayersLeft")}
            </p>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground" suppressHydrationWarning>
              {t("calendar.player1")}
            </span>
            <p className="text-sm font-medium">
              {players.find((player) => player.id === user?.playerId)?.name ?? user?.name}
            </p>
          </label>

          {mode === "partner" && renderPartnerField()}

          {mode === "solo" && (
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {isFullRotation ? t("calendar.rotationSoloHint") : isSoloOnly ? t("calendar.soloOnlyHint") : t("calendar.soloHint")}
            </p>
          )}

          {mode === "partner" && registerMutation.isError && (
            <p className="text-sm text-destructive">{(registerMutation.error as Error).message}</p>
          )}

          {mode === "solo" && registerSoloMutation.isError && (
            <p className="text-sm text-destructive">{(registerSoloMutation.error as Error).message}</p>
          )}
        </div>

        <DialogFooter>
          {mode === "solo" ? (
            <Button onClick={() => registerSoloMutation.mutate()} disabled={registerSoloMutation.isPending}>
              <span suppressHydrationWarning>{t("calendar.register")}</span>
            </Button>
          ) : (
            <Button onClick={() => registerMutation.mutate()} disabled={!canRegister || registerMutation.isPending}>
              <span suppressHydrationWarning>{t("calendar.register")}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
