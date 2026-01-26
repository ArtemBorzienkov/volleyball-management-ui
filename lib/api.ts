const API = {
  GET_ALL_PLAYERS: `${process.env.NEXT_PUBLIC_HOST_URL}/players`,
  GET_PLAYER_BY_ID: (id: string) =>
    `${process.env.NEXT_PUBLIC_HOST_URL}/players/${id}`,
  CREATE_PLAYER: `${process.env.NEXT_PUBLIC_HOST_URL}/players`,
  GET_ALL_EVENTS: `${process.env.NEXT_PUBLIC_HOST_URL}/events`,
  GET_EVENT_BY_ID: (id: string) =>
    `${process.env.NEXT_PUBLIC_HOST_URL}/events/${id}`,
  CREATE_EVENT_WITH_GAMES: `${process.env.NEXT_PUBLIC_HOST_URL}/events/with-games`,
  GET_ALL_GAMES: `${process.env.NEXT_PUBLIC_HOST_URL}/games`,
  GET_GAME_BY_ID: (id: string) =>
    `${process.env.NEXT_PUBLIC_HOST_URL}/games/${id}`,
  GET_ALL_TEAMS: `${process.env.NEXT_PUBLIC_HOST_URL}/teams`,
  GET_TEAM_BY_ID: (id: string) =>
    `${process.env.NEXT_PUBLIC_HOST_URL}/teams/${id}`,
  GET_TOP_PLAYERS_BY_WINS: `${process.env.NEXT_PUBLIC_HOST_URL}/rankings/wins`,
  GET_TOP_PLAYERS_BY_WIN_RATE: `${process.env.NEXT_PUBLIC_HOST_URL}/rankings/win-rate`,
  GET_TOP_PLAYERS_BY_WON_EVENTS: `${process.env.NEXT_PUBLIC_HOST_URL}/rankings/won-events`,
  GET_TOP_PLAYERS_BY_GAMES_PLAYED: `${process.env.NEXT_PUBLIC_HOST_URL}/rankings/games-played`,
  GET_BEST_TEAM_COMBINATIONS: `${process.env.NEXT_PUBLIC_HOST_URL}/rankings/best-team-combinations`,
};

export default API;
