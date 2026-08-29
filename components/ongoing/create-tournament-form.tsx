"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { TeamRosterEditor, type TeamDraft } from "@/components/ongoing/team-roster-editor";
import { SelectInput } from "@/components/ui/select-input";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/components/providers/auth-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import API from "@/lib/api";
import type { Player } from "@/lib/types";

interface CreatedOngoingEvent {
  id: string;
}

interface CreateTournamentFormProps {
  onCreated?: (id: string) => void;
}

export function CreateTournamentForm({ onCreated }: CreateTournamentFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [location, setLocation] = useState("");
  const [maxTeams, setMaxTeams] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [allowSoloRegistration, setAllowSoloRegistration] = useState(false);
  const [teams, setTeams] = useState<TeamDraft[]>([]);

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["players"],
    queryFn: async () => {
      const response = await fetch(API.GET_ALL_PLAYERS);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
  });

  // Mirrors ongoing-config-tab.tsx: a row missing either player must not be discarded silently.
  const hasIncompleteTeam = teams.some((team) => !team.player1Id || !team.player2Id);

  const createMutation = useMutation({
    mutationFn: async (): Promise<CreatedOngoingEvent> => {
      const trimmedMaxTeams = maxTeams.trim();
      const trimmedStartTime = startTime.trim();
      const trimmedLocation = location.trim();
      const completeTeams = teams.filter((team) => team.player1Id && team.player2Id);
      // react-day-picker hands back a local-midnight Date; re-anchoring to UTC midnight for the same
      // Y/M/D keeps the calendar day the admin picked agreeing with the backend's UTC-date comparison.
      const pickedUtcMidnight = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const body: Record<string, unknown> = { name: name.trim(), date: pickedUtcMidnight.toISOString() };
      if (trimmedMaxTeams) body.maxTeams = Number(trimmedMaxTeams);
      // Sent unconditionally: flipping a control back to its default must not be silently dropped.
      body.visibility = visibility;
      body.allowSoloRegistration = allowSoloRegistration;
      if (completeTeams.length) body.teams = completeTeams;
      // startTime is a venue-local wall-clock string ("HH:MM"), never a timezone-aware instant.
      if (trimmedStartTime) body.startTime = trimmedStartTime;
      if (trimmedLocation) body.location = trimmedLocation;

      const response = await fetch(API.CREATE_ONGOING_EVENT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
      // A new tournament is open for registration straight away, so /calendar's list is stale too.
      queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
      toast({ title: t("toast.tournamentCreated"), description: name.trim(), variant: "success" });
      onCreated?.(created.id);
    },
    onError: (error: Error) => {
      toast({ title: t("toast.tournamentCreateFailed"), description: error.message, variant: "error" });
    },
  });

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        {/* Paired into rows so the dialog fits without scrolling; the hint lines were folded into
            placeholders for the same reason. */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="tournament-name" suppressHydrationWarning>
              {t("ongoing.create.nameLabel")}
            </label>
            <Input id="tournament-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5 sm:w-40">
            <label className="text-sm font-medium" htmlFor="max-teams" suppressHydrationWarning>
              {t("ongoing.create.maxTeamsLabel")}
            </label>
            <Input
              id="max-teams"
              type="number"
              min={2}
              value={maxTeams}
              onChange={(event) => setMaxTeams(event.target.value)}
              placeholder={t("ongoing.create.maxTeamsHint")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="location" suppressHydrationWarning>
              {t("ongoing.create.locationLabel")}
            </label>
            <Input
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder={t("ongoing.create.locationHint")}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:w-40">
            <label className="text-sm font-medium" htmlFor="start-time" suppressHydrationWarning>
              {t("ongoing.create.startTimeLabel")}
            </label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-col gap-1.5 sm:w-56">
            <label className="text-sm font-medium" suppressHydrationWarning>
              {t("ongoing.create.dateLabel")}
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selected) => {
                    if (!selected) return;
                    setDate(selected);
                    setIsCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <SelectInput
            className="flex-1"
            name="visibility"
            label={t("ongoing.create.visibilityLabel")}
            value={visibility}
            onChange={setVisibility}
            options={[
              { value: "public", label: t("ongoing.create.visibilityPublic") },
              { value: "private", label: t("ongoing.create.visibilityPrivate") },
            ]}
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={allowSoloRegistration}
            onChange={(event) => setAllowSoloRegistration(event.target.checked)}
          />
          <span className="flex flex-col gap-0.5">
            <span className="font-medium" suppressHydrationWarning>
              {t("ongoing.create.allowSoloLabel")}
            </span>
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t("ongoing.create.allowSoloHint")}
            </span>
          </span>
        </label>


        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" suppressHydrationWarning>
            {t("ongoing.create.teamsLabel")}
          </label>
          <TeamRosterEditor teams={teams} players={players} onChange={setTeams} />
        </div>

        {hasIncompleteTeam && (
          <p className="text-sm text-destructive" suppressHydrationWarning>
            {t("ongoing.config.incompleteTeam")}
          </p>
        )}

        {createMutation.isError && (
          <p className="text-sm text-destructive">{(createMutation.error as Error).message}</p>
        )}

        {user ? (
          <Button
            className="self-start"
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || hasIncompleteTeam || createMutation.isPending}
          >
            <span suppressHydrationWarning>{t("ongoing.create.submit")}</span>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-block self-start">
                <Button disabled>
                  <span suppressHydrationWarning>{t("ongoing.create.submit")}</span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Щоб створити турнір, потрібно бути залогіненим</TooltipContent>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
}
