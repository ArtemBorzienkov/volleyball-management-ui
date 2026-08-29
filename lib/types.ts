export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  playerId: string | null;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  gender?: "male" | "female";
  active: boolean;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  setsWon: number;
  setsLost: number;
  pointsScored: number;
  pointsConceded: number;
  tournamentsWon: number;
}

export interface Team {
  player1: Player;
  player2: Player;
}

export interface Game {
  id: string;
  team1: Team;
  team2: Team;
  score: {
    team1Sets: number;
    team2Sets: number;
    sets: { team1: number; team2: number }[];
  };
  date: string;
  location: string;
  eventId: string;
  winner: "team1" | "team2";
}

export interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  games: Game[];
  winners: Player[];
  status: "upcoming" | "ongoing" | "completed";
}

export interface PlayerStats {
  player: Player;
  winRate: number;
  avgPointsPerGame: number;
  avgPointsDiff: number;
  currentStreak: number;
  longestStreak: number;
}

export interface HeadToHead {
  player1: Player;
  player2: Player;
  gamesAsTeam: number;
  winsAsTeam: number;
  lossesAsTeam: number;
  winRateAsTeam: number;
  gamesAgainst: number;
  winsAgainst: number;
  lossesAgainst: number;
  winRateAgainst: number;
}

export interface TeamStats {
  player1: Player;
  player2: Player;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPointsDiff: number;
}

export interface MedalCounts {
  gold: number;
  silver: number;
  bronze: number;
}

export interface PlayerRanking {
  metric: string;
  player: Player;
  rank: number;
  value: number | MedalCounts; // Number for most metrics, MedalCounts for eventsWon metric
  totalEvents?: number; // Total events participated in (for eventsWon metric)
  eventsWon?: number; // Deprecated - use value.gold for eventsWon metric
}

export interface PlayerRankHistory {
  gameId: string;
  date: string;
  rank: number;
  rankChange: number;
}

export interface PlayerGameRowPlayer {
  id: string;
  name: string;
}

export interface PlayerGameRowTeam {
  player1: PlayerGameRowPlayer;
  player2: PlayerGameRowPlayer;
  points: number;
}

export interface PlayerGameRow {
  gameId: string;
  date: string;
  team1: PlayerGameRowTeam; // page player's team; page player is player1
  team2: PlayerGameRowTeam;
  rankChange: number;
  newRating: number;
}

export interface PlayerGamesResponse {
  games: PlayerGameRow[];
  total: number;
}

export interface FullPlayer extends Player {
  totalEvents: number;
  medals: MedalCounts;
  totalGames: number;
  winRate: number;
  rank: number;
  recentGames: string[]; // Array of 'win' | 'lose'
}

export interface OngoingEventCreator {
  id: string;
  name: string;
}

export interface OngoingEventListItem {
  id: string;
  name: string;
  date: string;
  startTime: string | null;
  location: string | null;
  createdByUserId: string | null;
  createdBy: OngoingEventCreator | null;
  visibility: string;
  teamsCount: number;
  gamesCount: number;
  playedCount: number;
  teams: OngoingTeam[];
  soloPlayers: OngoingSoloPlayer[];
}

export interface OngoingEventConfig {
  gamesPerPair: number;
  courts: number;
  maxTeams: number | null;
  scheme: string;
  groupCount: number;
  qualifiersPerGroup: number | null;
  visibility: string;
  allowSoloRegistration: boolean;
}

export interface OngoingTeamPlayer {
  id: string;
  name: string;
  avatar?: string;
}

export interface OngoingTeam {
  id: string;
  player1: OngoingTeamPlayer;
  player2: OngoingTeamPlayer;
  rating: number;
  groupIndex: number | null;
}

export interface OngoingSoloPlayer {
  id: string;
  player: OngoingTeamPlayer;
  rating: number;
}

export interface OngoingSoloPair {
  player1: OngoingTeamPlayer;
  player2: OngoingTeamPlayer;
  rating: number;
}

export interface OngoingSoloPairPreview {
  pairs: OngoingSoloPair[];
  unpaired: OngoingTeamPlayer[];
}

export interface OngoingGame {
  id: string;
  eventId: string;
  team1Id: string | null;
  team2Id: string | null;
  team1Points: number | null;
  team2Points: number | null;
  round: number;
  court: number;
  order: number;
  phase: string;
  bracketRound: number | null;
  bracketSlot: number | null;
  thirdPlace: boolean;
}

export interface OngoingEvent {
  id: string;
  name: string;
  date: string;
  startTime: string | null;
  location: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string | null;
  config: OngoingEventConfig;
  teams: OngoingTeam[];
  soloPlayers: OngoingSoloPlayer[];
  games: OngoingGame[];
}

export interface OngoingOpenEvent {
  id: string;
  name: string;
  date: string;
  startTime: string | null;
  location: string | null;
  maxTeams: number | null;
  teamsCount: number;
  createdByUserId: string | null;
  createdBy: OngoingEventCreator | null;
  teams: OngoingTeam[];
  visibility: string;
  allowSoloRegistration: boolean;
  soloPlayers: OngoingSoloPlayer[];
}

export interface OngoingStandingsRow {
  place: number;
  team: OngoingTeam;
  played: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
}
