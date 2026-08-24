import type { OngoingGame, OngoingStandingsRow, OngoingTeam } from "@/lib/types";

export function teamName(team: OngoingTeam): string {
  return `${team.player1.name} & ${team.player2.name}`;
}

export function isPlayed(game: OngoingGame): boolean {
  return game.team1Points !== null && game.team2Points !== null;
}

export function computeStandings(
  teams: OngoingTeam[],
  games: OngoingGame[],
): OngoingStandingsRow[] {
  const rows = new Map<string, Omit<OngoingStandingsRow, "place">>();

  for (const team of teams) {
    rows.set(team.id, {
      team,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
    });
  }

  for (const game of games) {
    if (game.phase !== "group") continue;
    if (!isPlayed(game)) continue;
    if (game.team1Id === null || game.team2Id === null) continue;

    const team1 = rows.get(game.team1Id);
    const team2 = rows.get(game.team2Id);
    if (!team1 || !team2) continue;

    const points1 = game.team1Points as number;
    const points2 = game.team2Points as number;

    team1.played += 1;
    team2.played += 1;
    team1.pointsFor += points1;
    team1.pointsAgainst += points2;
    team2.pointsFor += points2;
    team2.pointsAgainst += points1;

    if (points1 > points2) {
      team1.wins += 1;
      team2.losses += 1;
    } else {
      team2.wins += 1;
      team1.losses += 1;
    }
  }

  const sorted = Array.from(rows.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });

  return sorted.map((row, index) => ({ ...row, place: index + 1 }));
}
