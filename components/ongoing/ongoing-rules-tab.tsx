"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { ROTATION_GROUP_SIZE } from "@/lib/ongoing-permissions";
import { isSchemeStep, ruleTranslationKey, visibleRuleKeys } from "@/lib/ongoing-rules";
import type { OngoingEvent } from "@/lib/types";

interface OngoingRulesTabProps {
  event: OngoingEvent;
}

/**
 * How this particular tournament is run, in the reader's language and with its own numbers filled
 * in. Visible to everyone: the format decides what a player should expect from the day, and until
 * now it was only inferable from the Config tab, which entrants cannot open.
 *
 * Which rules appear is the organiser's to choose in Config — a rule switched off there is not
 * rendered at all, rather than shown greyed out.
 */
export function OngoingRulesTab({ event }: OngoingRulesTabProps) {
  const { t } = useTranslation();
  const { scheme, groupCount, qualifiersPerGroup, rotationRounds, gamesPerPair, courts, hiddenRules } = event.config;

  const visible = visibleRuleKeys(scheme, hiddenRules);
  const stepKeys = visible.filter(isSchemeStep);
  const houseRuleKeys = visible.filter((key) => !isSchemeStep(key));

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

          {stepKeys.length > 0 && (
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm text-muted-foreground">
              {stepKeys.map((key) => (
                <li key={key} suppressHydrationWarning>
                  {t(ruleTranslationKey(key), values)}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* House rules: each one its own card, in catalogue order. */}
      {houseRuleKeys.map((key) => (
        <Card key={key}>
          <CardContent className="flex flex-col gap-2 p-4">
            <h3 className="text-sm font-medium" suppressHydrationWarning>
              {t(`${ruleTranslationKey(key)}Title`)}
            </h3>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t(key === "tiebreak" ? tiebreakKey(scheme) : ruleTranslationKey(key))}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// The tie-break reads differently for an individual format, where the table ranks players rather
// than pairs — one rule, two wordings, so it stays one checkbox in Config.
function tiebreakKey(scheme: string): string {
  return scheme === "fullRotation" ? "ongoing.rules.tiebreakRotation" : "ongoing.rules.tiebreakTeams";
}
