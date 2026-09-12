"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SelectInput } from "@/components/ui/select-input";
import { NewPlayerInlineForm } from "@/components/ongoing/new-player-inline";
import type { Player } from "@/lib/types";

interface SoloPlayerDraftEditorProps {
  /** Selected player ids, in order. An empty string is an unfilled row. */
  playerIds: string[];
  players: Player[];
  /** Players already committed to a pair — the API rejects entering one twice. */
  unavailablePlayerIds?: string[];
  onChange: (playerIds: string[]) => void;
}

/**
 * Picks individual entrants for a tournament that accepts registration without a partner — the
 * counterpart to TeamRosterEditor, which can only build pairs. Without it a solo-registration
 * tournament could be created with a team roster but no way to seed the pool it advertises.
 */
export function SoloPlayerDraftEditor({
  playerIds,
  players,
  unavailablePlayerIds = [],
  onChange,
}: SoloPlayerDraftEditorProps) {
  const { t } = useTranslation();

  // Players created inline this session, merged in so the row that triggered creation can select
  // them immediately rather than waiting on the ["players"] refetch.
  const [createdPlayers, setCreatedPlayers] = useState<Player[]>([]);
  const [newPlayerRow, setNewPlayerRow] = useState<number | null>(null);

  const knownPlayerIds = new Set(players.map((player) => player.id));
  const allPlayers = [...players, ...createdPlayers.filter((player) => !knownPlayerIds.has(player.id))];

  const taken = new Set([...playerIds.filter(Boolean), ...unavailablePlayerIds]);

  const update = (index: number, playerId: string) =>
    onChange(playerIds.map((current, position) => (position === index ? playerId : current)));

  return (
    <>
      {playerIds.map((selected, index) => (
        <div key={index} className="flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <SelectInput
                name={`solo-${index}`}
                placeholder={t("ongoing.config.selectPlayer")}
                value={selected}
                onChange={(playerId) => update(index, playerId)}
                options={allPlayers
                  .filter((player) => player.id === selected || !taken.has(player.id))
                  .map((player) => ({ value: player.id, label: player.name }))}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setNewPlayerRow(index)}
              disabled={newPlayerRow !== null && newPlayerRow !== index}
              aria-label={t("calendar.addNewPlayer")}
            >
              <Plus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("ongoing.create.removeSoloPlayer")}
              onClick={() => onChange(playerIds.filter((_, position) => position !== index))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {newPlayerRow === index && (
            <NewPlayerInlineForm
              onCreated={(player) => {
                update(index, player.id);
                setCreatedPlayers((previous) => [...previous, player]);
                setNewPlayerRow(null);
              }}
              onCancel={() => setNewPlayerRow(null)}
            />
          )}
        </div>
      ))}

      <Button type="button" variant="outline" className="self-start" onClick={() => onChange([...playerIds, ""])}>
        <Plus className="mr-2 h-4 w-4" />
        <span suppressHydrationWarning>{t("ongoing.create.addSoloPlayer")}</span>
      </Button>
    </>
  );
}
