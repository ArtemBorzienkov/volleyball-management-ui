import { computeStandings } from "@/lib/ongoing-standings";
import type { OngoingEvent, OngoingGame, OngoingTeam } from "@/lib/types";

export interface TeamPlacement {
  team: OngoingTeam;
  place: number;
}

// Winner/loser follow the same tie-break the backend uses when advancing a bracket game
// (team1Points > team2Points ? team1 : team2) — an unplayed game yields null for both.
function winnerTeamId(game: OngoingGame): string | null {
  if (game.team1Points === null || game.team2Points === null) return null;
  return game.team1Points > game.team2Points ? game.team1Id : game.team2Id;
}

function loserTeamId(game: OngoingGame): string | null {
  if (game.team1Points === null || game.team2Points === null) return null;
  return game.team1Points > game.team2Points ? game.team2Id : game.team1Id;
}

function addTeamAtPlace(
  result: TeamPlacement[],
  teamsById: Map<string, OngoingTeam>,
  place: number,
  teamId: string | null,
): void {
  if (!teamId) return;
  const team = teamsById.get(teamId);
  if (!team) return;
  result.push({ team, place });
}

// roundRobin has no bracket: the live Standings order (wins, then point diff, then points scored)
// is already a total order, so it doubles as the placement, with no ties.
function teamPlacementsFromStandings(event: OngoingEvent): TeamPlacement[] {
  return computeStandings(event.teams, event.games).map((row) => ({ team: row.team, place: row.place }));
}

// For a groupsPlayoff tournament, resolved incrementally as results come in rather than only once
// the whole bracket is done: final -> 1st/2nd, 3rd-place match (if any) -> 3rd/4th, every other
// round r (1..k-2) ties all of that round's losers at N/2^r + 1, and group teams that never reached
// the bracket tie one place past it at N+1. Any game that hasn't been played yet — including the
// final itself — simply contributes nothing yet, so a team still alive has no place at all until it
// is eliminated or crowned.
function teamPlacementsFromBracket(event: OngoingEvent): TeamPlacement[] {
  const teamsById = new Map(event.teams.map((team) => [team.id, team]));
  const result: TeamPlacement[] = [];

  const playoffGames = event.games.filter((game) => game.phase === "playoff");
  const bracketGames = playoffGames.filter(
    (game) => !game.thirdPlace && game.bracketRound !== null,
  );
  const thirdPlaceGame = playoffGames.find((game) => game.thirdPlace);

  if (!bracketGames.length) return teamPlacementsFromStandings(event);

  const bracketRounds = bracketGames.map((game) => game.bracketRound as number);
  const k = Math.max(...bracketRounds);
  const bracketSize = 2 ** k;

  const finalGame = bracketGames.find((game) => game.bracketRound === k);
  addTeamAtPlace(result, teamsById, 1, winnerTeamId(finalGame as OngoingGame));
  addTeamAtPlace(result, teamsById, 2, loserTeamId(finalGame as OngoingGame));

  if (thirdPlaceGame) {
    addTeamAtPlace(result, teamsById, 3, winnerTeamId(thirdPlaceGame));
    addTeamAtPlace(result, teamsById, 4, loserTeamId(thirdPlaceGame));
  }

  // Rounds 1..k-2: the final (round k) and semifinal (round k-1) are resolved individually above.
  for (let r = 1; r <= k - 2; r++) {
    const place = bracketSize / 2 ** r + 1;
    for (const game of bracketGames) {
      if (game.bracketRound !== r) continue;
      addTeamAtPlace(result, teamsById, place, loserTeamId(game));
    }
  }

  const qualifiedTeamIds = new Set<string>();
  for (const game of bracketGames) {
    if (game.team1Id) qualifiedTeamIds.add(game.team1Id);
    if (game.team2Id) qualifiedTeamIds.add(game.team2Id);
  }
  for (const team of event.teams) {
    if (qualifiedTeamIds.has(team.id)) continue;
    addTeamAtPlace(result, teamsById, bracketSize + 1, team.id);
  }

  return result;
}

// Every team with a place resolved so far, sorted 1st to last (ties broken by team id for a stable
// order). A team still alive in the bracket — or, pre-playoff, meaningless since roundRobin/standings
// always resolve everyone — simply doesn't appear yet; callers that want "every team, including the
// still-undecided ones" should diff this list's team ids against `event.teams` themselves.
export function computeTeamPlacements(event: OngoingEvent): TeamPlacement[] {
  const placements =
    event.config.scheme !== "groupsPlayoff" ? teamPlacementsFromStandings(event) : teamPlacementsFromBracket(event);

  return placements.slice().sort((a, b) => a.place - b.place || a.team.id.localeCompare(b.team.id));
}

// Final placements for a completed OngoingEvent, keyed by place (as a string) to the player ids of
// every team tied at that place — the exact shape CreateEventWithGamesDto.places expects.
export function computeOngoingPlacements(event: OngoingEvent): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const { team, place } of computeTeamPlacements(event)) {
    const key = String(place);
    const players = result[key] ?? (result[key] = []);
    players.push(team.player1.id, team.player2.id);
  }

  return result;
}
