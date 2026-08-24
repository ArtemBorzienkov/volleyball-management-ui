"use client";

import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { teamName } from "@/lib/ongoing-standings";
import { cn } from "@/lib/utils";
import type { OngoingStandingsRow, OngoingTeam } from "@/lib/types";

export function groupLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export interface GroupedTeams {
  byGroup: Map<number, OngoingTeam[]>;
  groupIndices: number[];
  unassigned: OngoingTeam[];
}

export function groupTeams(teams: OngoingTeam[]): GroupedTeams {
  const byGroup = new Map<number, OngoingTeam[]>();
  const unassigned: OngoingTeam[] = [];

  for (const team of teams) {
    if (team.groupIndex === null) {
      unassigned.push(team);
      continue;
    }
    const list = byGroup.get(team.groupIndex) ?? [];
    list.push(team);
    byGroup.set(team.groupIndex, list);
  }

  return { byGroup, groupIndices: Array.from(byGroup.keys()).sort((a, b) => a - b), unassigned };
}

interface StandingsTableProps {
  standings: OngoingStandingsRow[];
  heading?: string;
  // Places 1..qualifyingPlaces are marked as advancing. Null or absent marks nothing.
  qualifyingPlaces?: number | null;
}

export function StandingsTable({ standings, heading, qualifyingPlaces }: StandingsTableProps) {
  const { t } = useTranslation();
  const marked = qualifyingPlaces ?? 0;

  return (
    <div>
      {heading ? (
        <h3 className="mb-2 text-sm font-medium" suppressHydrationWarning>
          {heading}
        </h3>
      ) : null}
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" suppressHydrationWarning>
                  {t("ongoing.standings.place")}
                </TableHead>
                <TableHead suppressHydrationWarning>
                  {t("ongoing.standings.team")}
                </TableHead>
                <TableHead className="text-right" suppressHydrationWarning>
                  {t("ongoing.standings.played")}
                </TableHead>
                <TableHead className="text-right" suppressHydrationWarning>
                  {t("ongoing.standings.wins")}
                </TableHead>
                <TableHead className="text-right" suppressHydrationWarning>
                  {t("ongoing.standings.losses")}
                </TableHead>
                <TableHead className="text-right" suppressHydrationWarning>
                  {t("ongoing.standings.points")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((row) => {
                const qualifies = row.place <= marked;

                return (
                  <TableRow key={row.team.id} className={cn(qualifies && "bg-secondary")}>
                    <TableCell className={cn("text-muted-foreground", qualifies && "font-semibold text-foreground")}>
                      {row.place}
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        {teamName(row.team)}
                        {qualifies ? (
                          <span
                            className="rounded-sm border border-foreground px-1 text-[10px] font-bold leading-4"
                            title={t("ongoing.bracket.qualifiesLegend")}
                            suppressHydrationWarning
                          >
                            {t("ongoing.bracket.qualifies")}
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.played}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.wins}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.losses}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {row.pointsFor}–{row.pointsAgainst}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
