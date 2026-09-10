import { format } from "date-fns";
import { computeOngoingPlacements } from "@/lib/ongoing-placements";
import { isPlayed } from "@/lib/ongoing-standings";
import { eventCalendarDay } from "@/lib/ongoing-date";
import type { OngoingEvent, OngoingGame, OngoingTeam } from "@/lib/types";

// Shared by the write side (this file's caller, on the ongoing event page) and the read side
// (add-results/page.tsx) so a rename can't desync the two.
export const ONGOING_FINISH_PREFILL_KEY = "ongoing-finish-prefill";

/**
 * Which ongoing tournament the prefill came from, so /add-results can clear it once the results are
 * safely in `events`/`games`/`game_player_rank`. Kept in its own key on purpose: the prefill above is
 * fed straight into the form's reset(), and an extra field there would end up in the submitted body.
 */
export const ONGOING_FINISH_EVENT_ID_KEY = "ongoing-finish-event-id";

// Mirrors app/add-results/page.tsx's own FormData shape exactly (games/places rows, not the
// grouped DTO shape) — the payload here is read straight into that form's `reset()`, so any drift
// between the two shapes would silently prefill the wrong fields.
export interface FinishTournamentGameResult {
  team1Player1: string;
  team1Player2: string;
  team2Player1: string;
  team2Player2: string;
  team1Points: number;
  team2Points: number;
}

export interface FinishTournamentPlaceResult {
  place: string;
  playerId: string;
}

export interface FinishTournamentPrefill {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  places: FinishTournamentPlaceResult[];
  games: FinishTournamentGameResult[];
}

function gameResultFor(
  game: OngoingGame,
  teamsById: Map<string, OngoingTeam>,
): FinishTournamentGameResult | null {
  if (game.team1Points === null || game.team2Points === null) return null;

  // A fullRotation fixture has no team rows at all — its two sides are ad-hoc pairs recorded in
  // side1Players/side2Players. Reading only team1Id/team2Id here is what made the hand-off arrive
  // at /add-results with an empty form: every game was silently skipped.
  if (game.side1Players.length === 2 && game.side2Players.length === 2) {
    return {
      team1Player1: game.side1Players[0].id,
      team1Player2: game.side1Players[1].id,
      team2Player1: game.side2Players[0].id,
      team2Player2: game.side2Players[1].id,
      team1Points: game.team1Points,
      team2Points: game.team2Points,
    };
  }

  const team1 = game.team1Id ? teamsById.get(game.team1Id) : undefined;
  const team2 = game.team2Id ? teamsById.get(game.team2Id) : undefined;
  if (!team1 || !team2) return null;

  return {
    team1Player1: team1.player1.id,
    team1Player2: team1.player2.id,
    team2Player1: team2.player1.id,
    team2Player2: team2.player2.id,
    team1Points: game.team1Points,
    team2Points: game.team2Points,
  };
}

// Builds the prefill for the "Finish tournament" handoff to /add-results — see the design doc
// (2026-08-24-bracket-completion-design.md §4). Every field is computed from data already loaded
// on the ongoing event page; nothing here calls the API.
export function buildFinishTournamentPrefill(event: OngoingEvent): FinishTournamentPrefill {
  const teamsById = new Map(event.teams.map((team) => [team.id, team]));

  const games: FinishTournamentGameResult[] = [];
  for (const game of event.games) {
    if (!isPlayed(game)) continue;
    const result = gameResultFor(game, teamsById);
    if (result) games.push(result);
  }

  const places: FinishTournamentPlaceResult[] = [];
  const placementsByPlace = computeOngoingPlacements(event);
  for (const [place, playerIds] of Object.entries(placementsByPlace)) {
    for (const playerId of playerIds) {
      places.push({ place, playerId });
    }
  }

  return {
    eventName: event.name,
    // <input type="date"> requires yyyy-MM-dd; the date is stored as UTC midnight of the
    // calendar day, so it must be pinned via eventCalendarDay rather than reparsed locally.
    eventDate: format(eventCalendarDay(event.date), "yyyy-MM-dd"),
    eventLocation: event.location ?? "",
    places,
    games,
  };
}

export type FinishTournamentGate =
  | { canFinish: true }
  | { canFinish: false; reasonKey: string };

// Per the design spec §4: groupsPlayoff finishes once the final (and the 3rd-place match, if one
// exists) has a result; roundRobin finishes once every scheduled game has a result.
export function getFinishTournamentGate(event: OngoingEvent): FinishTournamentGate {
  if (event.config.scheme === "groupsPlayoff") {
    const playoffGames = event.games.filter((game) => game.phase === "playoff");
    const bracketGames = playoffGames.filter((game) => !game.thirdPlace && game.bracketRound !== null);
    const thirdPlaceGame = playoffGames.find((game) => game.thirdPlace) ?? null;

    if (!bracketGames.length) return { canFinish: false, reasonKey: "ongoing.finish.noPlayoff" };

    const maxBracketRound = Math.max(...bracketGames.map((game) => game.bracketRound as number));
    const finalGame = bracketGames.find((game) => game.bracketRound === maxBracketRound) ?? null;

    if (!finalGame || !isPlayed(finalGame)) {
      return { canFinish: false, reasonKey: "ongoing.finish.finalNotPlayed" };
    }
    if (thirdPlaceGame && !isPlayed(thirdPlaceGame)) {
      return { canFinish: false, reasonKey: "ongoing.finish.thirdPlaceNotPlayed" };
    }
    return { canFinish: true };
  }

  if (!event.games.length) return { canFinish: false, reasonKey: "ongoing.finish.noGames" };
  if (!event.games.every(isPlayed)) return { canFinish: false, reasonKey: "ongoing.finish.gamesNotPlayed" };

  // Every generated game being played is not enough for fullRotation: rounds are generated one at a
  // time, so round 1 of 3 satisfies the check above while the ladder has decided nothing yet and
  // finalStandings is still empty. Finishing there would upload a tournament with no placements.
  if (event.config.scheme === "fullRotation" && !event.rotation?.isFinished) {
    return { canFinish: false, reasonKey: "ongoing.finish.rotationNotFinished" };
  }

  return { canFinish: true };
}
