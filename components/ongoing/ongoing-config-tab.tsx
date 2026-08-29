"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectInput } from "@/components/ui/select-input";
import API from "@/lib/api";
import type { OngoingEvent, Player } from "@/lib/types";
import { OngoingRosterSection, rosterSignature } from "@/components/ongoing/ongoing-roster-section";

interface OngoingConfigTabProps {
  event: OngoingEvent;
}

async function putJson(url: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function OngoingConfigTab({ event }: OngoingConfigTabProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [gamesPerPair, setGamesPerPair] = useState(event.config.gamesPerPair);
  const [courts, setCourts] = useState(event.config.courts);
  // Kept as a string so the field can be blank (unlimited); seeded once here, never resynced.
  const [maxTeams, setMaxTeams] = useState(event.config.maxTeams != null ? String(event.config.maxTeams) : "");
  const [scheme, setScheme] = useState(event.config.scheme);
  // Seeded once from the loaded config, never resynced — same as maxTeams/scheme above.
  const [visibility, setVisibility] = useState(event.config.visibility);
  const [allowSoloRegistration, setAllowSoloRegistration] = useState(event.config.allowSoloRegistration);
  // Kept as strings so the fields can be blank while typing; seeded once here, never resynced.
  const [groupCount, setGroupCount] = useState(String(event.config.groupCount));
  const [qualifiersPerGroup, setQualifiersPerGroup] = useState(
    event.config.qualifiersPerGroup != null ? String(event.config.qualifiersPerGroup) : "",
  );

  const isGroupsPlayoff = scheme === "groupsPlayoff";
  // Number("") is 0, which would be an invalid group/qualifier count — fall back to the smallest
  // valid value instead of silently sending 0. The server has the final say on validity either way.
  const groupCountValue = groupCount.trim() === "" ? 2 : Number(groupCount);
  const qualifiersPerGroupValue = qualifiersPerGroup.trim() === "" ? 1 : Number(qualifiersPerGroup);

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["players"],
    queryFn: async () => {
      const response = await fetch(API.GET_ALL_PLAYERS);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    },
  });

  // The list page reads its Teams/Matches/Played counters from a separate query and /calendar reads
  // the open-for-registration list, so both have to be refreshed alongside the detail query. Lowering
  // maxTeams to the current team count closes registration, which only /calendar can show.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ongoing-event", event.id] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
  };

  const saveConfigMutation = useMutation({
    mutationFn: () =>
      putJson(API.UPDATE_ONGOING_CONFIG(event.id), {
        gamesPerPair,
        courts,
        // Number("") is 0, which the backend would reject or treat as a real cap — blank must stay null.
        maxTeams: maxTeams.trim() === "" ? null : Number(maxTeams),
        visibility,
        allowSoloRegistration,
        scheme,
        groupCount: groupCountValue,
        // Meaningless for roundRobin — the server forces null anyway, but send null rather than a stale number.
        qualifiersPerGroup: isGroupsPlayoff ? qualifiersPerGroupValue : null,
      }),
    onSuccess: invalidate,
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <p className="font-medium" suppressHydrationWarning>
            {t("ongoing.config.title")}
          </p>

          <SelectInput
            name="games-per-pair"
            label={t("ongoing.config.gamesPerPair")}
            value={String(gamesPerPair)}
            onChange={(next) => setGamesPerPair(Number(next))}
            options={[1, 2, 3].map((count) => ({ value: String(count), label: String(count) }))}
          />

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground" suppressHydrationWarning>
              {t("ongoing.config.courts")}
            </span>
            <Input
              type="number"
              min={1}
              value={courts}
              onChange={(changeEvent) => setCourts(Number(changeEvent.target.value))}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground" suppressHydrationWarning>
              {t("ongoing.config.maxTeams")}
            </span>
            <Input
              type="number"
              min={2}
              placeholder={t("ongoing.config.maxTeamsHint")}
              value={maxTeams}
              onChange={(changeEvent) => setMaxTeams(changeEvent.target.value)}
            />
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              {t("ongoing.config.maxTeamsHint")}
            </span>
          </label>

          <SelectInput
            name="config-visibility"
            label={t("ongoing.create.visibilityLabel")}
            value={visibility}
            onChange={setVisibility}
            options={[
              { value: "public", label: t("ongoing.create.visibilityPublic") },
              { value: "private", label: t("ongoing.create.visibilityPrivate") },
            ]}
          />

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={allowSoloRegistration}
              onChange={(changeEvent) => setAllowSoloRegistration(changeEvent.target.checked)}
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

          <SelectInput
            name="scheme"
            label={t("ongoing.config.scheme")}
            value={scheme}
            onChange={setScheme}
            options={[
              { value: "roundRobin", label: t("ongoing.config.schemeRoundRobin") },
              { value: "groupsPlayoff", label: t("ongoing.config.schemeGroupsPlayoff") },
            ]}
          />

          {isGroupsPlayoff && (
            <>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground" suppressHydrationWarning>
                  {t("ongoing.config.groupCount")}
                </span>
                <Input
                  type="number"
                  min={1}
                  value={groupCount}
                  onChange={(changeEvent) => setGroupCount(changeEvent.target.value)}
                />
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t("ongoing.config.groupCountHint")}
                </span>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground" suppressHydrationWarning>
                  {t("ongoing.config.qualifiersPerGroup")}
                </span>
                <Input
                  type="number"
                  min={1}
                  value={qualifiersPerGroup}
                  onChange={(changeEvent) => setQualifiersPerGroup(changeEvent.target.value)}
                />
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {t("ongoing.config.qualifiersPerGroupHint", { total: groupCountValue * qualifiersPerGroupValue })}
                </span>
              </label>
            </>
          )}

          <Button
            className="self-start"
            onClick={() => saveConfigMutation.mutate()}
            disabled={saveConfigMutation.isPending}
          >
            <span suppressHydrationWarning>{t("ongoing.config.save")}</span>
          </Button>

          {saveConfigMutation.isError && (
            <p className="text-sm text-destructive">{(saveConfigMutation.error as Error).message}</p>
          )}

          {saveConfigMutation.isSuccess &&
            gamesPerPair === event.config.gamesPerPair &&
            courts === event.config.courts &&
            (maxTeams.trim() === "" ? null : Number(maxTeams)) === event.config.maxTeams &&
            visibility === event.config.visibility &&
            allowSoloRegistration === event.config.allowSoloRegistration &&
            scheme === event.config.scheme &&
            groupCountValue === event.config.groupCount &&
            (isGroupsPlayoff ? qualifiersPerGroupValue : null) === event.config.qualifiersPerGroup && (
              <p className="text-sm text-green-700 dark:text-green-400" suppressHydrationWarning>
                {t("ongoing.config.saved")}
              </p>
            )}
        </CardContent>
      </Card>

      <OngoingRosterSection key={rosterSignature(event)} event={event} players={players} />
    </div>
  );
}
