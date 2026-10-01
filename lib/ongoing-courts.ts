import { isPlayed } from "@/lib/ongoing-standings";
import type { OngoingCourt, OngoingEvent, OngoingGame } from "@/lib/types";

// Mirrors the API's src/ongoing/courts.ts.
export const MAX_COURT_LABEL_LENGTH = 10;
export const MAX_COURTS = 20;

/** A court row as the editor holds it: rounds as text, so a field can be blank while typing. */
export interface CourtDraft {
  label: string;
  fromRound: string;
  /** Blank = to the end of the tournament. */
  toRound: string;
}

export const toCourtDrafts = (courts: OngoingCourt[]): CourtDraft[] =>
  courts.map((court) => ({
    label: court.label,
    fromRound: String(court.fromRound),
    toRound: court.toRound === null ? "" : String(court.toRound),
  }));

export const fromCourtDrafts = (drafts: CourtDraft[]): OngoingCourt[] =>
  drafts.map((draft, index) => ({
    label: draft.label.trim() || String(index + 1),
    fromRound: draft.fromRound.trim() === "" ? 1 : Number(draft.fromRound),
    toRound: draft.toRound.trim() === "" ? null : Number(draft.toRound),
  }));

/** A new row: open all day, labelled with the next number no court uses yet. */
export function newCourtDraft(existing: CourtDraft[]): CourtDraft {
  const taken = new Set(existing.map((draft) => draft.label.trim().toLocaleLowerCase()));
  let next = existing.length + 1;
  while (taken.has(String(next))) next += 1;
  return { label: String(next), fromRound: "1", toRound: "" };
}

export const DEFAULT_COURT_DRAFTS: CourtDraft[] = [{ label: "1", fromRound: "1", toRound: "" }];

/**
 * The first problem with a court list, as a translation key plus its values, or null when it is
 * valid. The API checks the same rules; this keeps the organiser from finding out on save.
 */
export function courtListProblem(drafts: CourtDraft[]): { key: string; values?: Record<string, unknown> } | null {
  if (!drafts.length) return { key: "ongoing.courts.errorEmpty" };
  if (drafts.length > MAX_COURTS) return { key: "ongoing.courts.errorTooMany", values: { max: MAX_COURTS } };

  const seen = new Set<string>();
  for (const [index, court] of fromCourtDrafts(drafts).entries()) {
    const position = index + 1;
    if (court.label.length > MAX_COURT_LABEL_LENGTH) {
      return { key: "ongoing.courts.errorLabelLength", values: { position, max: MAX_COURT_LABEL_LENGTH } };
    }
    const key = court.label.toLocaleLowerCase();
    if (seen.has(key)) return { key: "ongoing.courts.errorDuplicate", values: { label: court.label } };
    seen.add(key);

    if (!Number.isInteger(court.fromRound) || court.fromRound < 1) {
      return { key: "ongoing.courts.errorFrom", values: { position } };
    }
    if (court.toRound !== null && (!Number.isInteger(court.toRound) || court.toRound < court.fromRound)) {
      return { key: "ongoing.courts.errorTo", values: { position } };
    }
  }
  return null;
}

/**
 * Mirrors the API's isStructuralCourtChange: anything but a rename. Adding, removing, moving a court
 * or changing its rounds can move a fixture, so the API rebuilds the schedule for it — and refuses it
 * once a result exists.
 */
export function isStructuralCourtChange(before: OngoingCourt[], after: OngoingCourt[]): boolean {
  if (before.length !== after.length) return true;
  if (before.some((court, index) => court.fromRound !== after[index].fromRound || court.toRound !== after[index].toRound)) {
    return true;
  }
  const beforePosition = new Map(before.map((court, index) => [court.label.toLocaleLowerCase(), index]));
  return after.some((court, index) => {
    const previous = beforePosition.get(court.label.toLocaleLowerCase());
    return previous !== undefined && previous !== index;
  });
}

/**
 * What a match card calls its court. Only the round-robin and group-stage fixtures are scheduled
 * onto the organiser's courts; rotation fixtures carry a notional number and playoff games none.
 */
export function courtLabel(game: Pick<OngoingGame, "court" | "phase">, courts: OngoingCourt[]): string {
  if (game.phase === "group") return courts[game.court - 1]?.label ?? String(game.court);
  return String(game.court);
}

/**
 * Teams that sit out two rounds in a row somewhere in this schedule while they still have a game to
 * play — what the Matches tab warns about. Read from the fixtures themselves, so it is exact; a round
 * number with no fixtures at all is a break for everyone and is skipped rather than counted.
 */
export function teamsWithDoubleRest(games: OngoingGame[]): string[] {
  const scheduled = games.filter((game) => game.phase === "group" && game.team1Id && game.team2Id);
  const rounds = [...new Set(scheduled.map((game) => game.round))].sort((a, b) => a - b);
  const slot = new Map(rounds.map((round, index) => [round, index + 1]));

  const slotsByTeam = new Map<string, number[]>();
  for (const game of scheduled) {
    for (const teamId of [game.team1Id as string, game.team2Id as string]) {
      slotsByTeam.set(teamId, [...(slotsByTeam.get(teamId) ?? []), slot.get(game.round) as number]);
    }
  }

  const resting: string[] = [];
  for (const [teamId, slots] of slotsByTeam) {
    slots.sort((a, b) => a - b);
    let previous = 0;
    for (const current of slots) {
      if (current - previous - 1 >= 2) {
        resting.push(teamId);
        break;
      }
      previous = current;
    }
  }
  return resting.sort();
}

/** Whether any fixture has a result — after that the courts can only be renamed. */
export const hasRecordedResult = (event: Pick<OngoingEvent, "games">): boolean => event.games.some(isPlayed);
