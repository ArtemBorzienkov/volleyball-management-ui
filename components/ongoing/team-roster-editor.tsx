"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import { NewPlayerInlineForm } from "@/components/ongoing/new-player-inline";
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

  // Players created inline this session, merged in below so the slot that triggered creation
  // can show and select them immediately, without waiting on the ["players"] refetch.
  const [createdPlayers, setCreatedPlayers] = useState<Player[]>([]);
  const [newPlayerSlot, setNewPlayerSlot] = useState<string | null>(null);

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

  const openNewPlayerRow = (slot: string) => setNewPlayerSlot(slot);

  const renderPlayerSelect = (index: number, field: keyof TeamDraft) => {
    const selected = teams[index][field];
    return (
      <SelectInput
        name={slotKey(index, field)}
        placeholder={t("ongoing.config.selectPlayer")}
        value={selected}
        onChange={(playerId) => updateTeam(index, field, playerId)}
        options={allPlayers
          .filter((player) => player.id === selected || !takenPlayerIds.has(player.id))
          .map((player) => ({ value: player.id, label: player.name }))}
      />
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
        {newPlayerSlot === key && (
          <NewPlayerInlineForm
            onCreated={(player) => {
              updateTeam(index, field, player.id);
              setCreatedPlayers((previous) => [...previous, player]);
              setNewPlayerSlot(null);
            }}
            onCancel={() => setNewPlayerSlot(null)}
          />
        )}
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
