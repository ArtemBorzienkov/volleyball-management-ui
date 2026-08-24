"use client";

import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function TeamRosterEditor({ teams, players, onChange, disabled }: TeamRosterEditorProps) {
  const { t } = useTranslation();

  // A player already picked in another row must not be selectable again — the API rejects it anyway.
  const takenPlayerIds = new Set(
    teams.flatMap((team) => [team.player1Id, team.player2Id]).filter(Boolean),
  );

  const updateTeam = (index: number, field: keyof TeamDraft, value: string) => {
    onChange(teams.map((team, position) => (position === index ? { ...team, [field]: value } : team)));
  };

  const playerName = (id: string) => players.find((player) => player.id === id)?.name ?? "";

  const renderPlayerSelect = (index: number, field: keyof TeamDraft) => {
    const selected = teams[index][field];
    return (
      <select
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        value={selected}
        onChange={(changeEvent) => updateTeam(index, field, changeEvent.target.value)}
      >
        <option value="">{t("ongoing.config.selectPlayer")}</option>
        {players
          .filter((player) => player.id === selected || !takenPlayerIds.has(player.id))
          .map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
      </select>
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
        <div key={index} className="flex items-center gap-2">
          {renderPlayerSelect(index, "player1Id")}
          {renderPlayerSelect(index, "player2Id")}
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
