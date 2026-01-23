import type { Player, Game, Event, HeadToHead, TeamStats } from './types'

export const players: Player[] = [
  {
    id: '1',
    name: 'Marcus Silva',
    avatar: '/avatars/marcus.jpg',
    gender: 'male',
    active: true,
    totalGames: 48,
    totalWins: 35,
    totalLosses: 13,
    setsWon: 78,
    setsLost: 34,
    pointsScored: 1245,
    pointsConceded: 980,
    tournamentsWon: 4,
  },
  {
    id: '2',
    name: 'Elena Costa',
    avatar: '/avatars/elena.jpg',
    gender: 'female',
    active: true,
    totalGames: 52,
    totalWins: 38,
    totalLosses: 14,
    setsWon: 82,
    setsLost: 36,
    pointsScored: 1320,
    pointsConceded: 1010,
    tournamentsWon: 5,
  },
  {
    id: '3',
    name: 'Jake Thompson',
    avatar: '/avatars/jake.jpg',
    gender: 'male',
    active: true,
    totalGames: 45,
    totalWins: 28,
    totalLosses: 17,
    setsWon: 62,
    setsLost: 42,
    pointsScored: 1100,
    pointsConceded: 1050,
    tournamentsWon: 2,
  },
  {
    id: '4',
    name: 'Sofia Martinez',
    avatar: '/avatars/sofia.jpg',
    gender: 'female',
    active: true,
    totalGames: 50,
    totalWins: 32,
    totalLosses: 18,
    setsWon: 70,
    setsLost: 45,
    pointsScored: 1180,
    pointsConceded: 1080,
    tournamentsWon: 3,
  },
  {
    id: '5',
    name: 'Lucas Pereira',
    avatar: '/avatars/lucas.jpg',
    gender: 'male',
    active: true,
    totalGames: 42,
    totalWins: 30,
    totalLosses: 12,
    setsWon: 68,
    setsLost: 30,
    pointsScored: 1050,
    pointsConceded: 820,
    tournamentsWon: 3,
  },
  {
    id: '6',
    name: 'Mia Johnson',
    avatar: '/avatars/mia.jpg',
    gender: 'female',
    active: true,
    totalGames: 38,
    totalWins: 25,
    totalLosses: 13,
    setsWon: 55,
    setsLost: 32,
    pointsScored: 920,
    pointsConceded: 780,
    tournamentsWon: 2,
  },
  {
    id: '7',
    name: 'David Chen',
    avatar: '/avatars/david.jpg',
    gender: 'male',
    active: true,
    totalGames: 40,
    totalWins: 22,
    totalLosses: 18,
    setsWon: 50,
    setsLost: 42,
    pointsScored: 890,
    pointsConceded: 880,
    tournamentsWon: 1,
  },
  {
    id: '8',
    name: 'Isabella Santos',
    avatar: '/avatars/isabella.jpg',
    gender: 'female',
    active: true,
    totalGames: 44,
    totalWins: 29,
    totalLosses: 15,
    setsWon: 64,
    setsLost: 38,
    pointsScored: 1020,
    pointsConceded: 890,
    tournamentsWon: 2,
  },
  {
    id: '9',
    name: 'Ryan Mitchell',
    avatar: '/avatars/ryan.jpg',
    gender: 'male',
    active: false,
    totalGames: 35,
    totalWins: 18,
    totalLosses: 17,
    setsWon: 42,
    setsLost: 40,
    pointsScored: 780,
    pointsConceded: 770,
    tournamentsWon: 1,
  },
  {
    id: '10',
    name: 'Emma Wilson',
    avatar: '/avatars/emma.jpg',
    gender: 'female',
    active: true,
    totalGames: 46,
    totalWins: 31,
    totalLosses: 15,
    setsWon: 68,
    setsLost: 38,
    pointsScored: 1080,
    pointsConceded: 920,
    tournamentsWon: 3,
  },
  {
    id: '11',
    name: 'Alex Rivera',
    avatar: '/avatars/alex.jpg',
    gender: 'male',
    active: true,
    totalGames: 39,
    totalWins: 24,
    totalLosses: 15,
    setsWon: 54,
    setsLost: 36,
    pointsScored: 920,
    pointsConceded: 850,
    tournamentsWon: 2,
  },
  {
    id: '12',
    name: 'Olivia Brown',
    avatar: '/avatars/olivia.jpg',
    gender: 'female',
    active: true,
    totalGames: 41,
    totalWins: 26,
    totalLosses: 15,
    setsWon: 58,
    setsLost: 36,
    pointsScored: 960,
    pointsConceded: 870,
    tournamentsWon: 2,
  },
]

export const games: Game[] = [
  {
    id: 'g1',
    team1: { player1: players[0], player2: players[2] },
    team2: { player1: players[1], player2: players[3] },
    score: {
      team1Sets: 2,
      team2Sets: 1,
      sets: [
        { team1: 21, team2: 18 },
        { team1: 19, team2: 21 },
        { team1: 15, team2: 12 },
      ],
    },
    date: '2025-01-15',
    location: 'Copacabana Beach',
    eventId: 'e1',
    winner: 'team1',
  },
  {
    id: 'g2',
    team1: { player1: players[4], player2: players[6] },
    team2: { player1: players[5], player2: players[7] },
    score: {
      team1Sets: 2,
      team2Sets: 0,
      sets: [
        { team1: 21, team2: 16 },
        { team1: 21, team2: 19 },
      ],
    },
    date: '2025-01-15',
    location: 'Copacabana Beach',
    eventId: 'e1',
    winner: 'team1',
  },
  {
    id: 'g3',
    team1: { player1: players[0], player2: players[2] },
    team2: { player1: players[4], player2: players[6] },
    score: {
      team1Sets: 1,
      team2Sets: 2,
      sets: [
        { team1: 21, team2: 18 },
        { team1: 18, team2: 21 },
        { team1: 13, team2: 15 },
      ],
    },
    date: '2025-01-16',
    location: 'Copacabana Beach',
    eventId: 'e1',
    winner: 'team2',
  },
  {
    id: 'g4',
    team1: { player1: players[1], player2: players[3] },
    team2: { player1: players[5], player2: players[7] },
    score: {
      team1Sets: 2,
      team2Sets: 0,
      sets: [
        { team1: 21, team2: 14 },
        { team1: 21, team2: 17 },
      ],
    },
    date: '2025-01-16',
    location: 'Copacabana Beach',
    eventId: 'e1',
    winner: 'team1',
  },
  {
    id: 'g5',
    team1: { player1: players[1], player2: players[3] },
    team2: { player1: players[4], player2: players[6] },
    score: {
      team1Sets: 2,
      team2Sets: 1,
      sets: [
        { team1: 19, team2: 21 },
        { team1: 21, team2: 18 },
        { team1: 15, team2: 11 },
      ],
    },
    date: '2025-01-17',
    location: 'Copacabana Beach',
    eventId: 'e1',
    winner: 'team1',
  },
  {
    id: 'g6',
    team1: { player1: players[8], player2: players[10] },
    team2: { player1: players[9], player2: players[11] },
    score: {
      team1Sets: 0,
      team2Sets: 2,
      sets: [
        { team1: 18, team2: 21 },
        { team1: 16, team2: 21 },
      ],
    },
    date: '2025-01-20',
    location: 'Miami Beach',
    eventId: 'e2',
    winner: 'team2',
  },
  {
    id: 'g7',
    team1: { player1: players[0], player2: players[4] },
    team2: { player1: players[2], player2: players[6] },
    score: {
      team1Sets: 2,
      team2Sets: 0,
      sets: [
        { team1: 21, team2: 15 },
        { team1: 21, team2: 18 },
      ],
    },
    date: '2025-01-20',
    location: 'Miami Beach',
    eventId: 'e2',
    winner: 'team1',
  },
  {
    id: 'g8',
    team1: { player1: players[1], player2: players[5] },
    team2: { player1: players[3], player2: players[7] },
    score: {
      team1Sets: 2,
      team2Sets: 1,
      sets: [
        { team1: 21, team2: 23 },
        { team1: 21, team2: 19 },
        { team1: 15, team2: 13 },
      ],
    },
    date: '2025-01-21',
    location: 'Miami Beach',
    eventId: 'e2',
    winner: 'team1',
  },
  {
    id: 'g9',
    team1: { player1: players[0], player2: players[4] },
    team2: { player1: players[1], player2: players[5] },
    score: {
      team1Sets: 1,
      team2Sets: 2,
      sets: [
        { team1: 21, team2: 19 },
        { team1: 18, team2: 21 },
        { team1: 12, team2: 15 },
      ],
    },
    date: '2025-01-22',
    location: 'Miami Beach',
    eventId: 'e2',
    winner: 'team2',
  },
]

export const events: Event[] = [
  {
    id: 'e1',
    name: 'Rio Summer Championship 2025',
    startDate: '2025-01-15',
    endDate: '2025-01-17',
    location: 'Copacabana Beach, Rio de Janeiro',
    games: games.filter((g) => g.eventId === 'e1'),
    winners: [players[1], players[3]],
    status: 'completed',
  },
  {
    id: 'e2',
    name: 'Miami Beach Open 2025',
    startDate: '2025-01-20',
    endDate: '2025-01-22',
    location: 'Miami Beach, Florida',
    games: games.filter((g) => g.eventId === 'e2'),
    winners: [players[1], players[5]],
    status: 'completed',
  },
  {
    id: 'e3',
    name: 'California Pro Series',
    startDate: '2025-02-01',
    endDate: '2025-02-03',
    location: 'Huntington Beach, California',
    games: [],
    winners: [],
    status: 'upcoming',
  },
  {
    id: 'e4',
    name: 'Barcelona Beach Masters',
    startDate: '2025-02-15',
    endDate: '2025-02-17',
    location: 'Barceloneta Beach, Spain',
    games: [],
    winners: [],
    status: 'upcoming',
  },
]

export function getPlayerById(id: string): Player | undefined {
  return players.find((p) => p.id === id)
}

export function getEventById(id: string): Event | undefined {
  return events.find((e) => e.id === id)
}

export function getGameById(id: string): Game | undefined {
  return games.find((g) => g.id === id)
}

export function getPlayerWinRate(player: Player): number {
  if (player.totalGames === 0) return 0
  return Math.round((player.totalWins / player.totalGames) * 100)
}

export function getPlayerPointsDiff(player: Player): number {
  return player.pointsScored - player.pointsConceded
}

export function getTopPlayersByWins(limit = 10): Player[] {
  return [...players].sort((a, b) => b.totalWins - a.totalWins).slice(0, limit)
}

export function getTopPlayersByWinRate(limit = 10): Player[] {
  return [...players]
    .filter((p) => p.totalGames >= 10)
    .sort((a, b) => getPlayerWinRate(b) - getPlayerWinRate(a))
    .slice(0, limit)
}

export function getTopPlayersBySetsWon(limit = 10): Player[] {
  return [...players].sort((a, b) => b.setsWon - a.setsWon).slice(0, limit)
}

export function getTopPlayersByTournamentsWon(limit = 10): Player[] {
  return [...players].sort((a, b) => b.tournamentsWon - a.tournamentsWon).slice(0, limit)
}

export function getTopPlayersByPointsDiff(limit = 10): Player[] {
  return [...players]
    .sort((a, b) => getPlayerPointsDiff(b) - getPlayerPointsDiff(a))
    .slice(0, limit)
}

export function getHeadToHead(player1Id: string, player2Id: string): HeadToHead | null {
  const player1 = getPlayerById(player1Id)
  const player2 = getPlayerById(player2Id)
  if (!player1 || !player2) return null

  let gamesAsTeam = 0
  let winsAsTeam = 0
  let gamesAgainst = 0
  let winsAgainst = 0

  for (const game of games) {
    const team1Has1 =
      game.team1.player1.id === player1Id || game.team1.player2.id === player1Id
    const team1Has2 =
      game.team1.player1.id === player2Id || game.team1.player2.id === player2Id
    const team2Has1 =
      game.team2.player1.id === player1Id || game.team2.player2.id === player1Id
    const team2Has2 =
      game.team2.player1.id === player2Id || game.team2.player2.id === player2Id

    if ((team1Has1 && team1Has2) || (team2Has1 && team2Has2)) {
      gamesAsTeam++
      const isTeam1 = team1Has1 && team1Has2
      if ((isTeam1 && game.winner === 'team1') || (!isTeam1 && game.winner === 'team2')) {
        winsAsTeam++
      }
    }

    if ((team1Has1 && team2Has2) || (team1Has2 && team2Has1)) {
      gamesAgainst++
      const player1InTeam1 = team1Has1
      if (
        (player1InTeam1 && game.winner === 'team1') ||
        (!player1InTeam1 && game.winner === 'team2')
      ) {
        winsAgainst++
      }
    }
  }

  return {
    player1,
    player2,
    gamesAsTeam,
    winsAsTeam,
    lossesAsTeam: gamesAsTeam - winsAsTeam,
    winRateAsTeam: gamesAsTeam > 0 ? Math.round((winsAsTeam / gamesAsTeam) * 100) : 0,
    gamesAgainst,
    winsAgainst,
    lossesAgainst: gamesAgainst - winsAgainst,
    winRateAgainst: gamesAgainst > 0 ? Math.round((winsAgainst / gamesAgainst) * 100) : 0,
  }
}

export function getBestTeamCombinations(limit = 10): TeamStats[] {
  const teamMap = new Map<string, TeamStats>()

  for (const game of games) {
    const processTeam = (team: { player1: Player; player2: Player }, won: boolean) => {
      const ids = [team.player1.id, team.player2.id].sort()
      const key = ids.join('-')

      if (!teamMap.has(key)) {
        teamMap.set(key, {
          player1: team.player1,
          player2: team.player2,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          avgPointsDiff: 0,
        })
      }

      const stats = teamMap.get(key)!
      stats.gamesPlayed++
      if (won) stats.wins++
      else stats.losses++
      stats.winRate = Math.round((stats.wins / stats.gamesPlayed) * 100)
    }

    processTeam(game.team1, game.winner === 'team1')
    processTeam(game.team2, game.winner === 'team2')
  }

  return Array.from(teamMap.values())
    .filter((t) => t.gamesPlayed >= 2)
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins)
    .slice(0, limit)
}

export function getPlayerGames(playerId: string): Game[] {
  return games.filter(
    (g) =>
      g.team1.player1.id === playerId ||
      g.team1.player2.id === playerId ||
      g.team2.player1.id === playerId ||
      g.team2.player2.id === playerId
  )
}

export function getRecentGames(limit = 10): Game[] {
  return [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit)
}

export function getPerformanceOverTime(playerId: string) {
  const playerGames = getPlayerGames(playerId).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  let cumWins = 0
  let cumGames = 0

  return playerGames.map((game) => {
    cumGames++
    const inTeam1 =
      game.team1.player1.id === playerId || game.team1.player2.id === playerId
    const won =
      (inTeam1 && game.winner === 'team1') || (!inTeam1 && game.winner === 'team2')
    if (won) cumWins++

    return {
      date: game.date,
      winRate: Math.round((cumWins / cumGames) * 100),
      wins: cumWins,
      games: cumGames,
    }
  })
}
