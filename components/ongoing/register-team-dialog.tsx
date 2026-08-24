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
import { Input } from "@/components/ui/input";
import API from "@/lib/api";
import type { OngoingOpenEvent, Player } from "@/lib/types";

interface RegisterTeamDialogProps {
  event: OngoingOpenEvent;
  players: Player[];
}

type PlayerSlot = "player1" | "player2";

export function RegisterTeamDialog({ event, players }: RegisterTeamDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  // Players created inline this session, merged in below so the slot that triggered creation
  // can show and select them immediately, without waiting on the ["players"] refetch.
  const [createdPlayers, setCreatedPlayers] = useState<Player[]>([]);
  const [newPlayerSlot, setNewPlayerSlot] = useState<PlayerSlot | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerGender, setNewPlayerGender] = useState("");

  const knownPlayerIds = new Set(players.map((player) => player.id));
  const allPlayers = [...players, ...createdPlayers.filter((player) => !knownPlayerIds.has(player.id))];

  // A player already on a roster in this event can't be picked again — the API rejects it anyway.
  const registeredIds = new Set(event.teams.flatMap((team) => [team.player1.id, team.player2.id]));
  const availablePlayers = allPlayers.filter((player) => !registeredIds.has(player.id));

  const registerMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.ADD_ONGOING_TEAM(event.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player1Id, player2Id }),
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
      // Not a user-driven dismissal, so onOpenChange never fires — go through the same reset
      // path a manual close uses, or the inline create-player row survives into the next open.
      resetAndSetOpen(false);
    },
  });

  const clearNewPlayerRow = () => {
    setNewPlayerSlot(null);
    setNewPlayerName("");
    setNewPlayerGender("");
    createPlayerMutation.reset();
  };

  const createPlayerMutation = useMutation({
    mutationFn: async (): Promise<Player> => {
      const trimmedName = newPlayerName.trim();
      const response = await fetch(API.CREATE_PLAYER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          ...(newPlayerGender ? { gender: newPlayerGender } : {}),
          active: true,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (newPlayer) => {
      // The id comes straight from the response — no need to wait on the invalidation below.
      if (newPlayerSlot === "player1") {
        setPlayer1Id(newPlayer.id);
      } else if (newPlayerSlot === "player2") {
        setPlayer2Id(newPlayer.id);
      }
      setCreatedPlayers((previous) => [...previous, newPlayer]);
      queryClient.invalidateQueries({ queryKey: ["players"] });
      clearNewPlayerRow();
    },
  });

  const resetAndSetOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPlayer1Id("");
      setPlayer2Id("");
      setCreatedPlayers([]);
      registerMutation.reset();
      clearNewPlayerRow();
    }
  };

  const canRegister = Boolean(player1Id) && Boolean(player2Id) && player1Id !== player2Id;

  const openNewPlayerRow = (slot: PlayerSlot) => {
    setNewPlayerSlot(slot);
    setNewPlayerName("");
    setNewPlayerGender("");
    createPlayerMutation.reset();
  };

  const renderPlayerSelect = (
    value: string,
    onChange: (id: string) => void,
    excludeId: string,
  ) => (
    <select
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      onChange={(changeEvent) => onChange(changeEvent.target.value)}
    >
      <option value="">{t("ongoing.config.selectPlayer")}</option>
      {availablePlayers
        .filter((player) => player.id === value || player.id !== excludeId)
        .map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
    </select>
  );

  const renderNewPlayerRow = () => (
    <div className="flex flex-col gap-2 rounded-md border border-input p-3">
      <Input
        autoFocus
        value={newPlayerName}
        onChange={(changeEvent) => setNewPlayerName(changeEvent.target.value)}
        placeholder={t("addResults.addPlayerModal.namePlaceholder")}
      />
      <select
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={newPlayerGender}
        onChange={(changeEvent) => setNewPlayerGender(changeEvent.target.value)}
      >
        <option value="">{t("addResults.addPlayerModal.genderPlaceholder")}</option>
        <option value="male">{t("addResults.addPlayerModal.male")}</option>
        <option value="female">{t("addResults.addPlayerModal.female")}</option>
      </select>

      {createPlayerMutation.isError && (
        <p className="text-sm text-destructive">{(createPlayerMutation.error as Error).message}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearNewPlayerRow}
          disabled={createPlayerMutation.isPending}
        >
          <span suppressHydrationWarning>{t("addResults.addPlayerModal.cancel")}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => createPlayerMutation.mutate()}
          disabled={!newPlayerName.trim() || createPlayerMutation.isPending}
        >
          <span suppressHydrationWarning>
            {createPlayerMutation.isPending
              ? t("addResults.addPlayerModal.creating")
              : t("addResults.addPlayerModal.create")}
          </span>
        </Button>
      </div>
    </div>
  );

  const renderPlayerField = (
    slot: PlayerSlot,
    label: string,
    value: string,
    onChange: (id: string) => void,
    excludeId: string,
  ) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted-foreground" suppressHydrationWarning>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <div className="flex-1">{renderPlayerSelect(value, onChange, excludeId)}</div>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => openNewPlayerRow(slot)}
          disabled={newPlayerSlot !== null && newPlayerSlot !== slot}
          aria-label={t("calendar.addNewPlayer")}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {newPlayerSlot === slot && renderNewPlayerRow()}
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={resetAndSetOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <span suppressHydrationWarning>{t("calendar.register")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t("calendar.registerTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {availablePlayers.length === 0 && (
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t("calendar.noPlayersLeft")}
            </p>
          )}

          {renderPlayerField("player1", t("calendar.player1"), player1Id, setPlayer1Id, player2Id)}

          {renderPlayerField("player2", t("calendar.player2"), player2Id, setPlayer2Id, player1Id)}

          {registerMutation.isError && (
            <p className="text-sm text-destructive">{(registerMutation.error as Error).message}</p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => registerMutation.mutate()} disabled={!canRegister || registerMutation.isPending}>
            <span suppressHydrationWarning>{t("calendar.register")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
