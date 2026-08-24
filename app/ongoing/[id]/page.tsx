"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Settings, CalendarDays, ListOrdered, Trophy, FlagTriangleRight, Medal } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OngoingConfigTab } from "@/components/ongoing/ongoing-config-tab";
import { OngoingMatchesTab } from "@/components/ongoing/ongoing-matches-tab";
import { OngoingStandingsTab } from "@/components/ongoing/ongoing-standings-tab";
import { OngoingBracketTab } from "@/components/ongoing/ongoing-bracket-tab";
import { OngoingResultsTab } from "@/components/ongoing/ongoing-results-tab";
import { useIsAdmin } from "@/hooks/use-is-admin";
import API from "@/lib/api";
import { cn } from "@/lib/utils";
import { isPlayed } from "@/lib/ongoing-standings";
import { eventMetaLine } from "@/lib/ongoing-date";
import {
  buildFinishTournamentPrefill,
  getFinishTournamentGate,
  ONGOING_FINISH_PREFILL_KEY,
} from "@/lib/ongoing-finish";
import type { OngoingEvent } from "@/lib/types";

type OngoingTab = "config" | "matches" | "standings" | "bracket" | "results";

class HttpError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP error! status: ${status}`);
  }
}

const TABS: { key: OngoingTab; labelKey: string; icon: typeof Settings }[] = [
  { key: "matches", labelKey: "ongoing.tabs.matches", icon: CalendarDays },
  { key: "standings", labelKey: "ongoing.tabs.standings", icon: ListOrdered },
  { key: "bracket", labelKey: "ongoing.tabs.bracket", icon: Trophy },
  { key: "results", labelKey: "ongoing.tabs.results", icon: Medal },
  { key: "config", labelKey: "ongoing.tabs.config", icon: Settings },
];

export default function OngoingEventPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<OngoingTab>("matches");
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);

  const { data: event, isLoading, isError, error } = useQuery<OngoingEvent>({
    queryKey: ["ongoing-event", id],
    queryFn: async () => {
      const response = await fetch(API.GET_ONGOING_EVENT(id));
      if (!response.ok) throw new HttpError(response.status);
      return response.json();
    },
  });

  const isNotFound = error instanceof HttpError && error.status === 404;

  const hasPlayoffScheme = event?.config?.scheme === "groupsPlayoff";
  const visibleTabs = TABS.filter((item) => {
    if (item.key === "config") return isAdmin;
    if (item.key === "bracket") return hasPlayoffScheme;
    return true;
  });

  // An admin can switch the scheme away from groupsPlayoff while Bracket is selected, and the
  // config tab disappears the moment the admin gate flips. Derive the tab actually rendered
  // rather than syncing the selection back with an effect.
  const activeTab: OngoingTab = visibleTabs.some((item) => item.key === tab) ? tab : "matches";
  const isInProgress = event ? event.games.some(isPlayed) : false;
  const eventMeta = event ? eventMetaLine(event, "short") : "";
  const finishGate = event ? getFinishTournamentGate(event) : null;

  // Reuses the existing, already-reviewed /add-results submission path rather than writing to the
  // rating engine directly (see the design doc §4) — this only stages a prefill and navigates.
  // Finishing itself is a separate, confirmed step: it delists the tournament from the current
  // list and the calendar (both queries invalidated below) before the handoff.
  const finishMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.FINISH_ONGOING_TOURNAMENT(id), { method: "PATCH" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: t("ongoing.finish.requestFailed") }));
        throw new Error(body.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      if (!event) return;
      queryClient.invalidateQueries({ queryKey: ["ongoing-event", id] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
      queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
      const prefill = buildFinishTournamentPrefill(event);
      sessionStorage.setItem(ONGOING_FINISH_PREFILL_KEY, JSON.stringify(prefill));
      setIsFinishConfirmOpen(false);
      router.push("/add-results");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoading && (
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.loading")}
          </p>
        )}

        {isError && (
          <p className="text-sm text-destructive" suppressHydrationWarning>
            {isNotFound ? t("ongoing.notFound") : t("ongoing.loadFailed")}
          </p>
        )}

        {event && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
              <Badge variant={event.finishedAt ? "secondary" : isInProgress ? "default" : "secondary"} suppressHydrationWarning>
                {event.finishedAt
                  ? t("ongoing.badge.finished")
                  : isInProgress
                    ? t("ongoing.badge.inProgress")
                    : t("ongoing.badge.planning")}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{eventMeta}</p>

            {isAdmin && finishGate && !event.finishedAt ? (
              <div className="mt-4 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  disabled={!finishGate.canFinish}
                  onClick={() => setIsFinishConfirmOpen(true)}
                >
                  <FlagTriangleRight className="h-4 w-4" />
                  <span suppressHydrationWarning>{t("ongoing.finish.button")}</span>
                </Button>
                {!finishGate.canFinish && (
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {t(finishGate.reasonKey)}
                  </p>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {visibleTabs.map((item) => (
                <Button
                  key={item.key}
                  variant={activeTab === item.key ? "default" : "outline"}
                  onClick={() => setTab(item.key)}
                  className={cn("gap-2")}
                >
                  <item.icon className="h-4 w-4" />
                  <span suppressHydrationWarning>{t(item.labelKey)}</span>
                </Button>
              ))}
            </div>

            <div className="mt-6">
              {activeTab === "matches" && <OngoingMatchesTab event={event} />}
              {activeTab === "standings" && <OngoingStandingsTab event={event} />}
              {activeTab === "bracket" && <OngoingBracketTab event={event} />}
              {activeTab === "results" && <OngoingResultsTab event={event} />}
              {activeTab === "config" && isAdmin && <OngoingConfigTab event={event} />}
            </div>
          </>
        )}
      </main>

      <Dialog open={isFinishConfirmOpen} onOpenChange={setIsFinishConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>{t("ongoing.finish.confirmTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.finish.confirmBody")}
          </p>
          {finishMutation.isError && (
            <p className="text-sm text-destructive">{(finishMutation.error as Error).message}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFinishConfirmOpen(false)}>
              <span suppressHydrationWarning>{t("ongoing.finish.cancel")}</span>
            </Button>
            <Button disabled={finishMutation.isPending} onClick={() => finishMutation.mutate()}>
              <span suppressHydrationWarning>{t("ongoing.finish.confirm")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
