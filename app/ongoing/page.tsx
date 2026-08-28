"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Trash2, Plus } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { canManageOngoingEvent } from "@/lib/ongoing-permissions";
import API from "@/lib/api";
import { eventMetaLine } from "@/lib/ongoing-date";
import { teamName } from "@/lib/ongoing-standings";
import { normalizeOngoingListItem, type OlderOngoingEventListItem } from "@/lib/ongoing-normalize";
import type { OngoingEventListItem } from "@/lib/types";

async function fetchOngoingEvents(): Promise<OngoingEventListItem[]> {
  const response = await fetch(API.GET_ONGOING_EVENTS);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const raw: OlderOngoingEventListItem[] = await response.json();
  return raw.map(normalizeOngoingListItem);
}

export default function OngoingListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: events = [], isLoading } = useQuery<OngoingEventListItem[]>({
    queryKey: ["ongoing-events"],
    queryFn: fetchOngoingEvents,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(API.DELETE_ONGOING_EVENT(id), { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
    },
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
      // /calendar would otherwise keep offering the deleted tournament for registration and link to a dead page.
      queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
      // The detail cache would otherwise let Back render the deleted tournament and accept edits on it.
      queryClient.removeQueries({ queryKey: ["ongoing-event", id] });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
          {t("ongoing.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground" suppressHydrationWarning>
          {t("ongoing.subtitle")}
        </p>

        <div className="mt-6">
          {user ? (
            <Link href="/calendar">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                <span suppressHydrationWarning>{t("ongoing.newTournament")}</span>
              </Button>
            </Link>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-block">
                  <Button disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    <span suppressHydrationWarning>{t("ongoing.newTournament")}</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Щоб створити турнір, потрібно бути залогіненим</TooltipContent>
            </Tooltip>
          )}
        </div>

        {isLoading && (
          <p className="mt-6 text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.loading")}
          </p>
        )}

        {!isLoading && !events.length && (
          <p className="mt-6 text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.empty")}
          </p>
        )}

        {deleteMutation.isError && (
          <p className="mt-6 text-sm text-destructive">{(deleteMutation.error as Error).message}</p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {events.map((event) => {
            const dateMeta = eventMetaLine(event, "short");
            return (
            <Card key={event.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Only the heading is a link: the rosters below would otherwise be one huge click target. */}
                  <Link href={`/ongoing/${event.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{event.name}</p>
                      <Badge variant={event.playedCount === 0 ? "secondary" : "default"} suppressHydrationWarning>
                        {event.playedCount === 0 ? t("ongoing.badge.planning") : t("ongoing.badge.inProgress")}
                      </Badge>
                      <Badge
                        variant="outline"
                        title={
                          event.visibility === "private" ? t("calendar.privateHint") : t("ongoing.publicHint")
                        }
                        suppressHydrationWarning
                      >
                        {event.visibility === "private" ? t("ongoing.privateBadge") : t("ongoing.publicBadge")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dateMeta} · {t("ongoing.teams")}: {event.teamsCount} ·{" "}
                      {t("ongoing.matches")}: {event.gamesCount} · {t("ongoing.played")}: {event.playedCount}
                    </p>
                    {event.createdBy && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span suppressHydrationWarning>{t("ongoing.createdBy")}</span>: {event.createdBy.name}
                      </p>
                    )}
                  </Link>
                  {canManageOngoingEvent(user, event.createdByUserId) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("ongoing.delete")}
                      onClick={() => {
                        if (window.confirm(t("ongoing.deleteConfirm"))) deleteMutation.mutate(event.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>

                {event.teams.length > 0 && (
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span className="text-xs font-medium" suppressHydrationWarning>
                      {t("ongoing.teams")}
                    </span>
                    {/* Copied before sorting: the array belongs to the query cache. */}
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
                      {t("ongoing.withoutPartner")}
                    </span>
                    {[...event.soloPlayers]
                      .sort((a, b) => b.rating - a.rating)
                      .map((solo) => (
                        <span key={solo.id}>
                          {solo.player.name} <span className="text-foreground">{solo.rating}</span>
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
