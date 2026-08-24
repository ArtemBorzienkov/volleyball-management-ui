"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RegisterTeamDialog } from "@/components/ongoing/register-team-dialog";
import { CreateTournamentForm } from "@/components/ongoing/create-tournament-form";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { teamName } from "@/lib/ongoing-standings";
import { eventMetaLine } from "@/lib/ongoing-date";
import API from "@/lib/api";
import type { OngoingOpenEvent, Player } from "@/lib/types";

async function fetchOpenEvents(): Promise<OngoingOpenEvent[]> {
  const response = await fetch(API.GET_OPEN_ONGOING_EVENTS);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

async function fetchPlayers(): Promise<Player[]> {
  const response = await fetch(API.GET_ALL_PLAYERS);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

export default function CalendarPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
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

        {isAdmin && (
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
        )}

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
                    <Link href={`/ongoing/${event.id}`} className="min-w-0">
                      <p className="truncate font-medium hover:underline">{event.name}</p>
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{eventMeta}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span suppressHydrationWarning>{t("calendar.teams")}</span>: {event.teamsCount}/
                      {event.maxTeams ?? t("calendar.unlimited")}
                    </p>
                  </div>
                  <RegisterTeamDialog event={event} players={players} />
                </div>

                {event.teams.length > 0 && (
                  <ol className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {[...event.teams]
                      .sort((a, b) => b.rating - a.rating)
                      .map((team, index) => (
                        <li key={team.id}>
                          {index + 1}. {teamName(team)} <span className="text-foreground">{team.rating}</span>
                        </li>
                      ))}
                  </ol>
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
