"use client";

import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { computeRotationPlacements, computeTeamPlacements } from "@/lib/ongoing-placements";
import { playerDisplayName } from "@/lib/player-name";
import { teamName } from "@/lib/ongoing-standings";
import type { OngoingEvent } from "@/lib/types";

interface OngoingResultsTabProps {
  event: OngoingEvent;
}

// A team is eliminated the moment its bracket game is played, so it gets a place immediately —
// it does not wait for the rest of that round, let alone the final. Whatever hasn't been decided
// yet (the teams still alive in the bracket) simply has no place, and is listed separately below.
export function OngoingResultsTab({ event }: OngoingResultsTabProps) {
  const { t } = useTranslation();

  // fullRotation places players, not teams, and has no team rows at all — so the team-based path
  // below would bail on the empty-roster guard and show nothing.
  if (event.config.scheme === "fullRotation") {
    const rotationPlacements = computeRotationPlacements(event);

    if (!rotationPlacements.length) {
      return (
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {t("ongoing.standings.empty")}
        </p>
      );
    }

    return (
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" suppressHydrationWarning>
                  {t("ongoing.standings.place")}
                </TableHead>
                <TableHead suppressHydrationWarning>{t("ongoing.rotation.player")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rotationPlacements.map((row) => (
                <TableRow key={row.player.id}>
                  <TableCell className="text-muted-foreground">{row.place}</TableCell>
                  <TableCell className="font-medium">{playerDisplayName(row.player)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  if (!event.teams.length) {
    return (
      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
        {t("ongoing.standings.empty")}
      </p>
    );
  }

  const placements = computeTeamPlacements(event);
  const placedTeamIds = new Set(placements.map((row) => row.team.id));
  const stillPlaying = event.teams.filter((team) => !placedTeamIds.has(team.id));

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" suppressHydrationWarning>
                  {t("ongoing.standings.place")}
                </TableHead>
                <TableHead suppressHydrationWarning>{t("ongoing.standings.team")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.map((row) => (
                <TableRow key={row.team.id}>
                  <TableCell className="text-muted-foreground">{row.place}</TableCell>
                  <TableCell className="font-medium">{teamName(row.team)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {stillPlaying.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.results.stillPlaying")}
          </h3>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableBody>
                  {stillPlaying.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{teamName(team)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
