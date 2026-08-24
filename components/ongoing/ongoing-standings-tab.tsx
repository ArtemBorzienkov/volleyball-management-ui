"use client";

import { useTranslation } from "react-i18next";
import { computeStandings } from "@/lib/ongoing-standings";
import { StandingsTable, groupLetter, groupTeams } from "@/components/ongoing/standings-table";
import type { OngoingEvent } from "@/lib/types";

interface OngoingStandingsTabProps {
  event: OngoingEvent;
}

export function OngoingStandingsTab({ event }: OngoingStandingsTabProps) {
  const { t } = useTranslation();

  if (!event.teams.length) {
    return (
      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
        {t("ongoing.standings.empty")}
      </p>
    );
  }

  const { byGroup, groupIndices, unassigned } = groupTeams(event.teams);

  // A single real group (the flat round-robin case, groupIndex 0 for everyone) or no
  // schedule generated yet (every groupIndex null) must render exactly like before this
  // feature existed: one combined, unlabelled table over every team.
  if (groupIndices.length <= 1) {
    return <StandingsTable standings={computeStandings(event.teams, event.games)} />;
  }

  const qualifiersPerGroup = event.config?.qualifiersPerGroup ?? null;

  const groupSections = groupIndices.map((index) => ({
    key: index,
    heading: t("ongoing.standings.group", { letter: groupLetter(index) }),
    standings: computeStandings(byGroup.get(index) ?? [], event.games),
  }));

  return (
    <div className="flex flex-col gap-6">
      {groupSections.map((section) => (
        <StandingsTable
          key={section.key}
          standings={section.standings}
          heading={section.heading}
          qualifyingPlaces={qualifiersPerGroup}
        />
      ))}
      {qualifiersPerGroup ? (
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {t("ongoing.bracket.qualifiesLegend")}
        </p>
      ) : null}
      {unassigned.length > 0 ? (
        <StandingsTable
          standings={computeStandings(unassigned, event.games)}
          heading={t("ongoing.standings.noGroup")}
        />
      ) : null}
    </div>
  );
}
