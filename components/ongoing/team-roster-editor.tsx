"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import API from "@/lib/api";
import type { Player } from "@/lib/types";

export interface TeamDraft {
  player1Id: string;
  player2Id: string;
}

interface TeamRosterEditorProps {
  teams: TeamDraft[];
  players: Player[];
  onChange: (teams: TeamDraft[]) => void;
  disabled?: boolean;
}

const slotKey = (index: number, field: keyof TeamDraft): string => `${index}:${field}`;

export function TeamRosterEditor({ teams, players, onChange, disabled }: TeamRosterEditorProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Players created inline this session, merged in below so the slot that triggered creation
  // can show and select them immediately, without waiting on the ["players"] refetch.
  const [createdPlayers, setCreatedPlayers] = useState<Player[]>([]);
  const [newPlayerSlot, setNewPlayerSlot] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerGender, setNewPlayerGender] = useState("");

  const knownPlayerIds = new Set(players.map((player) => player.id));
  const allPlayers = [...players, ...createdPlayers.filter((player) => !knownPlayerIds.has(player.id))];

  // A player already picked in another row must not be selectable again — the API rejects it anyway.
  const takenPlayerIds = new Set(
    teams.flatMap((team) => [team.player1Id, team.player2Id]).filter(Boolean),
  );

  const updateTeam = (index: number, field: keyof TeamDraft, value: string) => {
    onChange(teams.map((team, position) => (position === index ? { ...team, [field]: value } : team)));
  };

  const playerName = (id: string) => allPlayers.find((player) => player.id === id)?.name ?? "";

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
          gender: newPlayerGender,
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
      // The slot that triggered creation gets the new player selected immediately.
      const [indexPart, field] = (newPlayerSlot ?? "").split(":") as [string, keyof TeamDraft];
      const index = Number(indexPart);
      if (newPlayerSlot && !Number.isNaN(index) && teams[index]) {
        updateTeam(index, field, newPlayer.id);
      }
      setCreatedPlayers((previous) => [...previous, newPlayer]);
      queryClient.invalidateQueries({ queryKey: ["players"] });
      clearNewPlayerRow();
    },
  });

  const openNewPlayerRow = (slot: string) => {
    setNewPlayerSlot(slot);
    setNewPlayerName("");
    setNewPlayerGender("");
    createPlayerMutation.reset();
  };

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
          disabled={!newPlayerName.trim() || !newPlayerGender || createPlayerMutation.isPending}
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

  const renderPlayerSelect = (index: number, field: keyof TeamDraft) => {
    const selected = teams[index][field];
    return (
      <select
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={selected}
        onChange={(changeEvent) => updateTeam(index, field, changeEvent.target.value)}
      >
        <option value="">{t("ongoing.config.selectPlayer")}</option>
        {allPlayers
          .filter((player) => player.id === selected || !takenPlayerIds.has(player.id))
          .map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
      </select>
    );
  };

  const renderPlayerField = (index: number, field: keyof TeamDraft) => {
    const key = slotKey(index, field);
    return (
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">{renderPlayerSelect(index, field)}</div>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => openNewPlayerRow(key)}
            disabled={newPlayerSlot !== null && newPlayerSlot !== key}
            aria-label={t("calendar.addNewPlayer")}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {newPlayerSlot === key && renderNewPlayerRow()}
      </div>
    );
  };

  if (disabled) {
    return (
      <div className="flex flex-col gap-2">
        {teams.map((team, index) => (
          <p key={index} className="text-sm">
            {playerName(team.player1Id)} / {playerName(team.player2Id)}
          </p>
        ))}
      </div>
    );
  }

  return (
    <>
      {teams.map((team, index) => (
        <div key={index} className="flex items-start gap-2">
          {renderPlayerField(index, "player1Id")}
          {renderPlayerField(index, "player2Id")}
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("ongoing.config.removeTeam")}
            onClick={() => onChange(teams.filter((_, position) => position !== index))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        className="self-start"
        onClick={() => onChange([...teams, { player1Id: "", player2Id: "" }])}
      >
        <Plus className="mr-2 h-4 w-4" />
        <span suppressHydrationWarning>{t("ongoing.config.addTeam")}</span>
      </Button>
    </>
  );
}
