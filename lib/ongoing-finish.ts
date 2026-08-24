import { format } from "date-fns";
import { computeOngoingPlacements } from "@/lib/ongoing-placements";
import { isPlayed } from "@/lib/ongoing-standings";
import { eventCalendarDay } from "@/lib/ongoing-date";
import type { OngoingEvent, OngoingGame, OngoingTeam } from "@/lib/types";

// Shared by the write side (this file's caller, on the ongoing event page) and the read side
// (add-results/page.tsx) so a rename can't desync the two.
export const ONGOING_FINISH_PREFILL_KEY = "ongoing-finish-prefill";

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
  const team1 = game.team1Id ? teamsById.get(game.team1Id) : undefined;
  const team2 = game.team2Id ? teamsById.get(game.team2Id) : undefined;
  if (!team1 || !team2 || game.team1Points === null || game.team2Points === null) return null;

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
  return { canFinish: true };
}
