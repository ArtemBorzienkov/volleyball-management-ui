import type { TFunction } from "i18next";

// Shared by the Bracket tab and the Matches tab's playoff section — one label for one round.
export function roundLabel(t: TFunction, round: number, totalRounds: number): string {
  const distanceToFinal = totalRounds - round;
  if (distanceToFinal === 0) return t("ongoing.bracket.final");
  if (distanceToFinal === 1) return t("ongoing.bracket.semifinals");
  if (distanceToFinal === 2) return t("ongoing.bracket.quarterfinals");
  return t("ongoing.bracket.round", { number: round });
}
