const API = {
  GET_ALL_PLAYERS: `${process.env.NEXT_PUBLIC_HOST_URL}/players`,
  GET_FULL_PLAYERS: `${process.env.NEXT_PUBLIC_HOST_URL}/players/full`,
  GET_PLAYER_BY_ID: (id: string) =>
    `${process.env.NEXT_PUBLIC_HOST_URL}/players/${id}`,
  CREATE_PLAYER: `${process.env.NEXT_PUBLIC_HOST_URL}/players`,
  REGISTER: `${process.env.NEXT_PUBLIC_HOST_URL}/user`,
  LOG_IN: `${process.env.NEXT_PUBLIC_HOST_URL}/auth/log-in`,
  LOG_OUT: `${process.env.NEXT_PUBLIC_HOST_URL}/auth/log-out`,
  GET_CURRENT_USER: `${process.env.NEXT_PUBLIC_HOST_URL}/user/me`,
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
  GET_TOP_PLAYERS_BY_RANK: `${process.env.NEXT_PUBLIC_HOST_URL}/rankings/top-rank`,
  GET_BEST_TEAM_COMBINATIONS: `${process.env.NEXT_PUBLIC_HOST_URL}/rankings/best-team-combinations`,
  GET_PLAYER_RANK_HISTORY: (id: string) =>
    `${process.env.NEXT_PUBLIC_HOST_URL}/rankings/player-rank-history?playerId=${id}`,
  GET_PLAYER_GAMES: (id: string, skip: number, take: number) =>
    `${process.env.NEXT_PUBLIC_HOST_URL}/games/player/${id}?skip=${skip}&take=${take}`,
  GET_ONGOING_EVENTS: `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing`,
  CREATE_ONGOING_EVENT: `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing`,
  GET_ONGOING_EVENT: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}`,
  DELETE_ONGOING_EVENT: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}`,
  UPDATE_ONGOING_CONFIG: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}/config`,
  SET_ONGOING_TEAMS: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}/teams`,
  GENERATE_ONGOING_SCHEDULE: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}/schedule`,
  GENERATE_ONGOING_PLAYOFF: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}/playoff`,
  DELETE_ONGOING_PLAYOFF: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}/playoff`,
  FINISH_ONGOING_TOURNAMENT: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}/finish`,
  UPDATE_ONGOING_GAME: (gameId: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/games/${gameId}`,
  CLEAR_ONGOING_GAME_RESULT: (gameId: string) =>
    `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/games/${gameId}/result`,
  GET_OPEN_ONGOING_EVENTS: `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/open`,
  ADD_ONGOING_TEAM: (id: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/${id}/teams`,
  REMOVE_ONGOING_TEAM: (teamId: string) => `${process.env.NEXT_PUBLIC_HOST_URL}/ongoing/teams/${teamId}`,
};

export default API;
