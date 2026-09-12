"use client";

import { useTranslation } from "react-i18next";
import { teamName } from "@/lib/ongoing-standings";
import { playerDisplayName } from "@/lib/player-name";
import { formatRegisteredAt } from "@/lib/ongoing-date";
import type { OngoingSoloPlayer, OngoingTeam } from "@/lib/types";

interface OngoingEntrantsListProps {
  teams: OngoingTeam[];
  soloPlayers: OngoingSoloPlayer[];
  /** fullRotation has no pairs, so its pool is simply "the participants". */
  scheme: string;
  /** Shown when nobody has entered yet. Omitted on the calendar card, which stays compact. */
  emptyText?: string;
}

/**
 * Read-only view of who has entered a tournament: pairs highest-rated first, then anyone without a
 * partner. Shared by the calendar card and the tournament page so the two cannot drift — the page
 * used to show this only inside the manage-only Config tab, leaving entrants unable to see the
 * roster they are part of.
 */
export function OngoingEntrantsList({ teams, soloPlayers, scheme, emptyText }: OngoingEntrantsListProps) {
  const { t } = useTranslation();
  const isFullRotation = scheme === "fullRotation";

  if (!teams.length && !soloPlayers.length) {
    return emptyText ? (
      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
        {emptyText}
      </p>
    ) : null;
  }

  return (
    <div className="flex flex-col gap-3">
      {teams.length > 0 && (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="text-xs font-medium" suppressHydrationWarning>
            {t("calendar.teams")}
          </span>
          <ol className="flex flex-col gap-1">
            {/* Copied before sorting: the array belongs to the query cache. */}
            {[...teams]
              .sort((a, b) => b.rating - a.rating)
              .map((team, index) => (
                <li key={team.id}>
                  {index + 1}. {teamName(team)} <span className="text-foreground">{team.rating}</span>
                  {formatRegisteredAt(team.registeredAt) && (
                    <span className="ml-2 text-xs opacity-70">{formatRegisteredAt(team.registeredAt)}</span>
                  )}
                </li>
              ))}
          </ol>
        </div>
      )}

      {soloPlayers.length > 0 && (
        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span className="text-xs font-medium" suppressHydrationWarning>
            {isFullRotation ? t("calendar.participants") : t("calendar.soloPool")}
          </span>
          {[...soloPlayers]
            .sort((a, b) => b.rating - a.rating)
            .map((solo) => (
              <span key={solo.id}>
                {playerDisplayName(solo.player)} <span className="text-foreground">{solo.rating}</span>
                {formatRegisteredAt(solo.registeredAt) && (
                  <span className="ml-2 text-xs opacity-70">{formatRegisteredAt(solo.registeredAt)}</span>
                )}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
