"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { ROTATION_GROUP_SIZE } from "@/lib/ongoing-permissions";
import type { OngoingEvent } from "@/lib/types";

interface OngoingRulesTabProps {
  event: OngoingEvent;
}

/**
 * How this particular tournament is run, in the reader's language and with its own numbers filled
 * in. Visible to everyone: the format decides what a player should expect from the day, and until
 * now it was only inferable from the Config tab, which entrants cannot open.
 */
export function OngoingRulesTab({ event }: OngoingRulesTabProps) {
  const { t } = useTranslation();
  const { scheme, groupCount, qualifiersPerGroup, rotationRounds, gamesPerPair, courts } = event.config;

  const stepKeys = RULE_STEPS[scheme] ?? RULE_STEPS.roundRobin;

  // Every number a step might interpolate, so the copy can mention whichever it needs.
  const values = {
    groups: groupCount,
    qualifiers: qualifiersPerGroup ?? 0,
    bracketTeams: groupCount * (qualifiersPerGroup ?? 0),
    rounds: rotationRounds,
    gamesPerPair,
    courts,
    groupSize: ROTATION_GROUP_SIZE,
    players: groupCount * ROTATION_GROUP_SIZE,
    fixtures: 3,
    movers: 2,
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-medium" suppressHydrationWarning>
              {t(`ongoing.rules.${scheme}.title`)}
            </h2>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t(`ongoing.rules.${scheme}.summary`, values)}
            </p>
          </div>

          <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
            {stepKeys.map((key) => (
              <li key={key} suppressHydrationWarning>
                {t(key, values)}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* A house rule about play itself, so it holds whatever the format is. */}
      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <h3 className="text-sm font-medium" suppressHydrationWarning>
            {t("ongoing.rules.servingTitle")}
          </h3>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("ongoing.rules.serving")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <h3 className="text-sm font-medium" suppressHydrationWarning>
            {t("ongoing.rules.tiebreakTitle")}
          </h3>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t(scheme === "fullRotation" ? "ongoing.rules.tiebreakRotation" : "ongoing.rules.tiebreakTeams")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** One entry per scheme; the steps read top to bottom as the day actually runs. */
const RULE_STEPS: Record<string, string[]> = {
  roundRobin: [
    "ongoing.rules.roundRobin.step1",
    "ongoing.rules.roundRobin.step2",
    "ongoing.rules.roundRobin.step3",
  ],
  groupsPlayoff: [
    "ongoing.rules.groupsPlayoff.step1",
    "ongoing.rules.groupsPlayoff.step2",
    "ongoing.rules.groupsPlayoff.step3",
    "ongoing.rules.groupsPlayoff.step4",
  ],
  fullRotation: [
    "ongoing.rules.fullRotation.step1",
    "ongoing.rules.fullRotation.step2",
    "ongoing.rules.fullRotation.step3",
    "ongoing.rules.fullRotation.step4",
    "ongoing.rules.fullRotation.step5",
  ],
};
