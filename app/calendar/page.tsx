"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RegisterTeamDialog } from "@/components/ongoing/register-team-dialog";
import { CreateTournamentForm } from "@/components/ongoing/create-tournament-form";
import { CancelRegistrationButton } from "@/components/ongoing/cancel-registration-button";
import { teamName } from "@/lib/ongoing-standings";
import { isOngoingEventFull } from "@/lib/ongoing-permissions";
import { eventMetaLine } from "@/lib/ongoing-date";
import { normalizeOngoingOpenEvent, type OlderOngoingOpenEvent } from "@/lib/ongoing-normalize";
import API from "@/lib/api";
import type { OngoingOpenEvent, Player } from "@/lib/types";
import { playerDisplayName } from "@/lib/player-name";

async function fetchOpenEvents(): Promise<OngoingOpenEvent[]> {
  const response = await fetch(API.GET_OPEN_ONGOING_EVENTS);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const raw: OlderOngoingOpenEvent[] = await response.json();
  return raw.map(normalizeOngoingOpenEvent);
}

async function fetchPlayers(): Promise<Player[]> {
  const response = await fetch(API.GET_ALL_PLAYERS);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

export default function CalendarPage() {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: events = [], isLoading, isError } = useQuery<OngoingOpenEvent[]>({
    queryKey: ["ongoing-open"],
    queryFn: fetchOpenEvents,
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
          {t("calendar.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground" suppressHydrationWarning>
          {t("calendar.subtitle")}
        </p>

        <div className="mt-6">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span suppressHydrationWarning>{t("calendar.newTournament")}</span>
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle suppressHydrationWarning>{t("calendar.newTournamentTitle")}</DialogTitle>
              </DialogHeader>
              <CreateTournamentForm onCreated={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground" suppressHydrationWarning>
            {t("calendar.loading")}
          </p>
        )}

        {isError && (
          <p className="mt-6 text-sm text-destructive" suppressHydrationWarning>
            {t("calendar.loadFailed")}
          </p>
        )}

        {!isLoading && !isError && !events.length && (
          <p className="mt-6 text-sm text-muted-foreground" suppressHydrationWarning>
            {t("calendar.empty")}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {events.map((event) => {
            const eventMeta = eventMetaLine(event, "long");
            return (
            <Card key={event.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/ongoing/${event.id}`} className="min-w-0">
                        <p className="truncate font-medium hover:underline">{event.name}</p>
                      </Link>
                      <Badge
                        variant="outline"
                        title={
                          event.visibility === "private" ? t("calendar.privateHint") : t("ongoing.publicHint")
                        }
                        suppressHydrationWarning
                      >
                        {event.visibility === "private" ? t("ongoing.privateBadge") : t("ongoing.publicBadge")}
                      </Badge>
                      {event.scheme === "fullRotation" && (
                        <Badge variant="secondary" title={t("calendar.rotationFormat")} suppressHydrationWarning>
                          {t("calendar.rotationBadge")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{eventMeta}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {/* fullRotation counts players against the seats its groups define; every other
                          scheme counts pairs against maxTeams. */}
                      {event.scheme === "fullRotation" ? (
                        <>
                          <span suppressHydrationWarning>{t("calendar.players")}</span>:{" "}
                          {event.soloPlayers.length}/{event.groupCount * 4}
                        </>
                      ) : (
                        <>
                          <span suppressHydrationWarning>{t("calendar.teams")}</span>: {event.teamsCount}/
                          {event.maxTeams ?? t("calendar.unlimited")}
                        </>
                      )}
                      {isOngoingEventFull(event) && (
                        <>
                          {" · "}
                          <span className="text-destructive" suppressHydrationWarning>
                            {t("calendar.noSpots")}
                          </span>
                        </>
                      )}
                    </p>
                    {event.scheme === "fullRotation" && (
                      <p className="mt-1 text-sm text-muted-foreground" suppressHydrationWarning>
                        {t("calendar.rotationFormat")}
                      </p>
                    )}
                    {event.createdBy && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span suppressHydrationWarning>{t("ongoing.createdBy")}</span>: {playerDisplayName(event.createdBy)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RegisterTeamDialog event={event} players={players} />
                    <CancelRegistrationButton event={event} />
                  </div>
                </div>

                {event.teams.length > 0 && (
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span className="text-xs font-medium" suppressHydrationWarning>
                      {t("calendar.teams")}
                    </span>
                    <ol className="flex flex-col gap-1">
                      {[...event.teams]
                        .sort((a, b) => b.rating - a.rating)
                        .map((team, index) => (
                          <li key={team.id}>
                            {index + 1}. {teamName(team)} <span className="text-foreground">{team.rating}</span>
                          </li>
                        ))}
                    </ol>
                  </div>
                )}

                {event.soloPlayers.length > 0 && (
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span className="text-xs font-medium" suppressHydrationWarning>
                      {/* In a rotation tournament everyone enters alone, so the pool IS the entry
                          list — "without a partner" would describe nothing. */}
                      {event.scheme === "fullRotation" ? t("calendar.participants") : t("calendar.soloPool")}
                    </span>
                    {/* Copied before sorting: the array belongs to the query cache. */}
                    {[...event.soloPlayers]
                      .sort((a, b) => b.rating - a.rating)
                      .map((solo) => (
                        <span key={solo.id}>
                          {playerDisplayName(solo.player)} <span className="text-foreground">{solo.rating}</span>
                        </span>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
