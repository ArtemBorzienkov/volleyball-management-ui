"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  Calendar,
  Users,
  Trophy,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import API from "@/lib/api";
import type { Event, Player, Game, Team } from "@/lib/types";
import {
  GoldMedalIcon,
  SilverMedalIcon,
  BronzeMedalIcon,
} from "@/components/medal-icons";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

// Backend EventResponseDto interface
interface BackendEventResponseDto {
  id: string;
  name: string;
  date: string | Date;
  location?: string;
  data?: Record<string, string[]>; // { gold: [playerId1, playerId2], silver: [...], bronze: [...] }
  games?: any[];
  members?: any[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Backend GameResponseDto interface
interface BackendGameResponseDto {
  id: string;
  eventId: string;
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
  team1Points: number;
  team2Points: number;
  date: string | Date;
  location?: string;
}

// Event places structure - handles all places (numeric keys "1", "2", "3" or string keys "gold", "silver", "bronze")
interface EventPlaces {
  [placeKey: string]: Player[]; // e.g., "1": [player1, player2], "2": [player3], "gold": [player4], etc.
}

// Player event statistics
interface PlayerEventStats {
  player: Player;
  wins: number;
  losses: number;
  winsInRow: number;
  hasNoWins: boolean;
  hasNoLosses: boolean;
}

// Player table row data
interface PlayerTableRow {
  player: Player;
  place: number;
  wins: number;
  losses: number;
  points: number;
  pointsWon: number;
  pointsLost: number;
}

// Player points
interface PlayerPoints {
  player: Player;
  points: number;
}

// Event summary statistics
interface EventSummaryStats {
  participantCount: number;
  totalPoints: number;
  averagePointsPerPlayer: number;
}

// Extended Event interface with places
interface EventWithPlaces extends Event {
  places?: EventPlaces;
  playerStats?: PlayerEventStats[];
  playerPoints?: PlayerPoints[];
  summaryStats?: EventSummaryStats;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
}

// Extract event places from backend event data - extracts ALL places
function extractEventPlaces(
  backendEvent: BackendEventResponseDto,
  playersById: Record<string, Player>,
): EventPlaces {
  const places: EventPlaces = {};

  if (!backendEvent.data || !Object.keys(playersById).length) {
    return places;
  }

  Object.keys(backendEvent.data).forEach((placeKey) => {
    backendEvent.data?.[placeKey]?.forEach((playerId: string) => {
      const player = playersById[playerId];
      if (!player) return;
      places[placeKey] = [...(places[placeKey] || []), player];
    });
  });

  return places;
}

// Calculate player points from backend games (before mapping to frontend Game structure)
function calculatePlayerPointsFromBackendGames(
  backendGames: BackendGameResponseDto[],
  playersById: Record<string, Player>,
): PlayerPoints[] {
  const pointsMap = new Map<string, number>();

  for (const backendGame of backendGames) {
    // Add team1Points to team1 players
    const team1Players = [
      backendGame.team1Player1Id,
      backendGame.team1Player2Id,
    ];
    for (const playerId of team1Players) {
      if (!pointsMap.has(playerId)) {
        pointsMap.set(playerId, 0);
      }
      pointsMap.set(
        playerId,
        pointsMap.get(playerId)! + backendGame.team1Points,
      );
    }

    // Add team2Points to team2 players
    const team2Players = [
      backendGame.team2Player1Id,
      backendGame.team2Player2Id,
    ];
    for (const playerId of team2Players) {
      if (!pointsMap.has(playerId)) {
        pointsMap.set(playerId, 0);
      }
      pointsMap.set(
        playerId,
        pointsMap.get(playerId)! + backendGame.team2Points,
      );
    }
  }

  // Convert to array and sort by points descending
  const playerPoints: PlayerPoints[] = [];
  for (const [playerId, points] of pointsMap.entries()) {
    const player = playersById[playerId];
    if (player) {
      playerPoints.push({ player, points });
    }
  }

  return playerPoints.sort((a, b) => b.points - a.points);
}

// Calculate player points from frontend Game structure (alternative method)
function calculatePlayerPoints(
  games: Game[],
  playersById: Record<string, Player>,
): PlayerPoints[] {
  const pointsMap = new Map<string, number>();

  for (const game of games) {
    // Get points from score structure
    // Sum all sets points for team1
    let team1Points = 0;
    if (game.score.sets && game.score.sets.length > 0) {
      for (const set of game.score.sets) {
        team1Points += set.team1 || 0;
      }
    } else {
      // Fallback: use team1Sets if sets array is empty
      team1Points = game.score.team1Sets || 0;
    }

    // Sum all sets points for team2
    let team2Points = 0;
    if (game.score.sets && game.score.sets.length > 0) {
      for (const set of game.score.sets) {
        team2Points += set.team2 || 0;
      }
    } else {
      // Fallback: use team2Sets if sets array is empty
      team2Points = game.score.team2Sets || 0;
    }

    // Add points for team1 players
    const team1Players = [game.team1.player1.id, game.team1.player2.id];
    for (const playerId of team1Players) {
      if (!pointsMap.has(playerId)) {
        pointsMap.set(playerId, 0);
      }
      pointsMap.set(playerId, pointsMap.get(playerId)! + team1Points);
    }

    // Add points for team2 players
    const team2Players = [game.team2.player1.id, game.team2.player2.id];
    for (const playerId of team2Players) {
      if (!pointsMap.has(playerId)) {
        pointsMap.set(playerId, 0);
      }
      pointsMap.set(playerId, pointsMap.get(playerId)! + team2Points);
    }
  }

  // Convert to array and sort by points descending
  const playerPoints: PlayerPoints[] = [];
  for (const [playerId, points] of pointsMap.entries()) {
    const player = playersById[playerId];
    if (player) {
      playerPoints.push({ player, points });
    }
  }

  return playerPoints.sort((a, b) => b.points - a.points);
}

// Calculate event summary statistics from backend games
function calculateEventSummaryStatsFromBackendGames(
  backendGames: BackendGameResponseDto[],
  places?: EventPlaces,
): EventSummaryStats {
  // Count unique participants from games
  const participantIds = new Set<string>();
  let totalPoints = 0;

  for (const backendGame of backendGames) {
    participantIds.add(backendGame.team1Player1Id);
    participantIds.add(backendGame.team1Player2Id);
    participantIds.add(backendGame.team2Player1Id);
    participantIds.add(backendGame.team2Player2Id);

    // Sum total points from all games
    totalPoints += backendGame.team1Points + backendGame.team2Points;
  }

  // Also include participants from places if available
  if (places) {
    for (const playerArray of Object.values(places)) {
      for (const player of playerArray) {
        participantIds.add(player.id);
      }
    }
  }

  const participantCount = participantIds.size;
  const averagePointsPerPlayer =
    participantCount > 0 ? Math.round(totalPoints / participantCount) : 0;

  return {
    participantCount,
    totalPoints,
    averagePointsPerPlayer,
  };
}

// Map backend game to frontend Game structure
function mapBackendGameToFrontend(
  backendGame: BackendGameResponseDto,
  playersById: Record<string, Player>,
): Game | null {
  const player1 = playersById[backendGame.team1Player1Id];
  const player2 = playersById[backendGame.team1Player2Id];
  const player3 = playersById[backendGame.team2Player1Id];
  const player4 = playersById[backendGame.team2Player2Id];

  // Skip if any player is missing
  if (!player1 || !player2 || !player3 || !player4) {
    return null;
  }

  const team1: Team = {
    player1,
    player2,
  };

  const team2: Team = {
    player1: player3,
    player2: player4,
  };

  // Determine winner based on points
  const winner: "team1" | "team2" =
    backendGame.team1Points > backendGame.team2Points ? "team1" : "team2";

  // Create score structure (using points as sets for simplicity)
  const team1Sets = backendGame.team1Points > backendGame.team2Points ? 1 : 0;
  const team2Sets = backendGame.team2Points > backendGame.team1Points ? 1 : 0;

  return {
    id: backendGame.id,
    team1,
    team2,
    score: {
      team1Sets,
      team2Sets,
      sets: [
        { team1: backendGame.team1Points, team2: backendGame.team2Points },
      ],
    },
    date:
      typeof backendGame.date === "string"
        ? backendGame.date
        : backendGame.date.toISOString(),
    location: backendGame.location || "",
    eventId: backendGame.eventId,
    winner,
  };
}

// Calculate player statistics from games
function calculatePlayerEventStats(
  games: Game[],
  playersById: Record<string, Player>,
): PlayerEventStats[] {
  const statsMap = new Map<string, PlayerEventStats>();

  // Sort games by date to process chronologically
  const sortedGames = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Track current streak for each player
  const currentStreaks = new Map<string, number>();

  for (const game of sortedGames) {
    const allPlayers = [
      game.team1.player1,
      game.team1.player2,
      game.team2.player1,
      game.team2.player2,
    ];

    for (const player of allPlayers) {
      if (!statsMap.has(player.id)) {
        statsMap.set(player.id, {
          player,
          wins: 0,
          losses: 0,
          winsInRow: 0,
          hasNoWins: false,
          hasNoLosses: false,
        });
        currentStreaks.set(player.id, 0);
      }

      const stats = statsMap.get(player.id)!;
      const inTeam1 =
        game.team1.player1.id === player.id ||
        game.team1.player2.id === player.id;
      const won =
        (inTeam1 && game.winner === "team1") ||
        (!inTeam1 && game.winner === "team2");

      if (won) {
        stats.wins++;
        const currentStreak = (currentStreaks.get(player.id) || 0) + 1;
        currentStreaks.set(player.id, currentStreak);
        stats.winsInRow = Math.max(stats.winsInRow, currentStreak);
      } else {
        stats.losses++;
        currentStreaks.set(player.id, 0);
      }
    }
  }

  // Finalize stats
  const statsArray = Array.from(statsMap.values());
  for (const stat of statsArray) {
    stat.hasNoWins = stat.losses > 0 && stat.wins === 0;
    stat.hasNoLosses = stat.wins > 0 && stat.losses === 0;
    // Update winsInRow to current streak
    stat.winsInRow = currentStreaks.get(stat.player.id) || 0;
  }

  return statsArray;
}

// Build player table data sorted by place
function buildPlayerTableData(event: EventWithPlaces): PlayerTableRow[] {
  const playerMap = new Map<string, PlayerTableRow>();

  // First, assign places from event.places
  if (!event.places) {
    return [];
  }
  
    const sortedPlaceKeys = Object.keys(event.places).sort((a, b) => {
      const keyMap: Record<string, number> = {
        gold: 1,
        silver: 2,
        bronze: 3,
      };
      const aNum = keyMap[a] ?? (isNaN(Number(a)) ? 999 : Number(a));
      const bNum = keyMap[b] ?? (isNaN(Number(b)) ? 999 : Number(b));
      return aNum - bNum;
    });

    sortedPlaceKeys.forEach(placeKey => {
      const players = event.places?.[placeKey];
      if (!players?.length) {
        return;
      }

      for (const player of players) {
        if (!playerMap.has(player.id)) {
          playerMap.set(player.id, {
            player,
            place: Number(placeKey),
            wins: 0,
            losses: 0,
            points: 0,
            pointsWon: 0,
            pointsLost: 0,
          });
        }
      }
    })

  // Add wins, losses, and calculate points won/lost from games
  if (event.games && event.games.length > 0) {
    for (const game of event.games) {
      const team1Players = [game.team1.player1.id, game.team1.player2.id];
      const team2Players = [game.team2.player1.id, game.team2.player2.id];

      // Get team points
      let team1Points = 0;
      let team2Points = 0;
      if (game.score.sets && game.score.sets.length > 0) {
        for (const set of game.score.sets) {
          team1Points += set.team1 || 0;
          team2Points += set.team2 || 0;
        }
      } else {
        team1Points = game.score.team1Sets || 0;
        team2Points = game.score.team2Sets || 0;
      }

      // Update team1 players
      for (const playerId of team1Players) {
        let row = playerMap.get(playerId);
        if (!row) {
          const player =
            game.team1.player1.id === playerId
              ? game.team1.player1
              : game.team1.player2;
          row = {
            player,
            place: 999,
            wins: 0,
            losses: 0,
            points: 0,
            pointsWon: 0,
            pointsLost: 0,
          };
          playerMap.set(playerId, row);
        }
        row.pointsWon += team1Points;
        row.pointsLost += team2Points;
        if (game.winner === "team1") {
          row.wins++;
        } else {
          row.losses++;
        }
      }

      // Update team2 players
      for (const playerId of team2Players) {
        let row = playerMap.get(playerId);
        if (!row) {
          const player =
            game.team2.player1.id === playerId
              ? game.team2.player1
              : game.team2.player2;
          row = {
            player,
            place: 999,
            wins: 0,
            losses: 0,
            points: 0,
            pointsWon: 0,
            pointsLost: 0,
          };
          playerMap.set(playerId, row);
        }
        row.pointsWon += team2Points;
        row.pointsLost += team1Points;
        if (game.winner === "team2") {
          row.wins++;
        } else {
          row.losses++;
        }
      }
    }
  }

  // Fallback: Add wins and losses from playerStats if games not available
  if (event.playerStats && (!event.games || event.games.length === 0)) {
    for (const stat of event.playerStats) {
      const row = playerMap.get(stat.player.id);
      if (row) {
        row.wins = stat.wins;
        row.losses = stat.losses;
      } else {
        playerMap.set(stat.player.id, {
          player: stat.player,
          place: 999,
          wins: stat.wins,
          losses: stat.losses,
          points: 0,
          pointsWon: 0,
          pointsLost: 0,
        });
      }
    }
  }

  // Add total points from playerPoints (for backward compatibility)
  if (event.playerPoints) {
    for (const playerPoint of event.playerPoints) {
      const row = playerMap.get(playerPoint.player.id);
      if (row) {
        row.points = playerPoint.points;
      } else {
        playerMap.set(playerPoint.player.id, {
          player: playerPoint.player,
          place: 999,
          wins: 0,
          losses: 0,
          points: playerPoint.points,
          pointsWon: 0,
          pointsLost: 0,
        });
      }
    }
  }

  // Convert to array and sort by place
  return Array.from(playerMap.values()).sort((a, b) => {
    // First sort by place
    if (a.place !== b.place) {
      return a.place - b.place;
    }
    // If same place, sort by points descending
    return b.points - a.points;
  });
}

function EventCard({ event }: { event: EventWithPlaces }) {
  const { t } = useTranslation();

  const statusColors = {
    upcoming: "bg-blue-500/20 text-blue-400",
    ongoing: "bg-green-500/20 text-green-400",
    completed: "bg-muted text-muted-foreground",
  };

  // Build table data
  const playerTableData = useMemo(() => !event.places && !event.playerStats && !event.playerPoints ? [] : buildPlayerTableData(event), [event]);

  // Get top highlights - each player can have only one highlight per event
  const highlights = useMemo(() => {
    if (!event.playerStats || event.status === "upcoming") {
      return [];
    }

    const playerHighlightsMap = new Map<
      string,
      { type: "streak" | "noWins" | "perfect"; player: Player; value: number }
    >();

    // Process all players and assign the best highlight for each
    for (const stat of event.playerStats) {
      const playerId = stat.player.id;

      // Priority: perfect > streak > noWins
      // Only assign if player doesn't have a highlight yet or if this is a better one

      // Check for perfect record (highest priority)
      if (stat.hasNoLosses && stat.wins > 0) {
        const existing = playerHighlightsMap.get(playerId);
        if (!existing || existing.type !== "perfect") {
          playerHighlightsMap.set(playerId, {
            type: "perfect",
            player: stat.player,
            value: stat.wins,
          });
        }
      }
      // Check for win streak (medium priority, only if not perfect)
      else if (stat.winsInRow > 0) {
        const existing = playerHighlightsMap.get(playerId);
        if (!existing) {
          playerHighlightsMap.set(playerId, {
            type: "streak",
            player: stat.player,
            value: stat.winsInRow,
          });
        } else if (
          existing.type === "streak" &&
          stat.winsInRow > existing.value
        ) {
          // Update if this streak is higher
          playerHighlightsMap.set(playerId, {
            type: "streak",
            player: stat.player,
            value: stat.winsInRow,
          });
        }
      }
      // Check for no wins (lowest priority, only if no other highlight)
      else if (stat.hasNoWins) {
        const existing = playerHighlightsMap.get(playerId);
        if (!existing) {
          playerHighlightsMap.set(playerId, {
            type: "noWins",
            player: stat.player,
            value: stat.losses,
          });
        }
      }
    }

    // Convert map to array and sort by priority and value
    const highlightsList = Array.from(playerHighlightsMap.values())
      .filter((highlight) => {
        // Filter out streak highlights with value 1
        return !(highlight.type === "streak" && highlight.value === 1);
      })
      .sort((a, b) => {
        // Priority order: perfect > streak > noWins
        const priorityOrder = { perfect: 3, streak: 2, noWins: 1 };
        const priorityDiff = priorityOrder[b.type] - priorityOrder[a.type];
        if (priorityDiff !== 0) return priorityDiff;

        // If same priority, sort by value (descending)
        return b.value - a.value;
      })
      .slice(0, 5); // Limit to 5 highlights

    return highlightsList;
  }, [event.playerStats, event.status]);

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="group transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
        <CardContent className="p-4">
          {/* Header Section - All in one row */}
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap min-w-0 flex-1">
              <Badge
                className={cn(
                  "capitalize text-xs flex-shrink-0",
                  statusColors[event.status],
                )}
                suppressHydrationWarning
              >
                {t(`events.status.${event.status}`)}
              </Badge>
              <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                {event.name}
              </h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(event.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{event.location}</span>
                  </span>
                )}
                <span
                  className="flex items-center gap-1.5 whitespace-nowrap"
                  suppressHydrationWarning
                >
                  <Trophy className="h-3.5 w-3.5" />
                  {event.games.length} {t("events.games")}
                </span>
                {event.summaryStats &&
                  event.summaryStats.participantCount > 0 && (
                    <span
                      className="flex items-center gap-1.5 whitespace-nowrap"
                      suppressHydrationWarning
                    >
                      <Users className="h-3.5 w-3.5" />
                      {event.summaryStats.participantCount}{" "}
                      {t("events.participants")}
                    </span>
                  )}
              </div>
            </div>
          </div>

          {/* Players List and Highlights - Three Sections */}
          {(playerTableData.length > 0 || highlights.length > 0) && (
            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - First Half of Players */}
                {playerTableData.length > 0 && (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[50%]">
                        {t("events.table.player")}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-border pl-2 text-center min-w-[80px]">
                        {t("events.table.gamesWL")}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-border pl-2 text-right min-w-[80px]">
                        {t("events.table.pointsWL")}
                      </span>
                    </div>
                    {playerTableData
                      .slice(0, Math.ceil(playerTableData.length / 2))
                      .map((row) => {
                        // Determine medal icon for top 3 places
                        let MedalIcon:
                          | typeof GoldMedalIcon
                          | typeof SilverMedalIcon
                          | typeof BronzeMedalIcon
                          | null = null;
                        if (row.place === 1) {
                          MedalIcon = GoldMedalIcon;
                        } else if (row.place === 2) {
                          MedalIcon = SilverMedalIcon;
                        } else if (row.place === 3) {
                          MedalIcon = BronzeMedalIcon;
                        }

                        return (
                          <div
                            key={row.player.id}
                            className="flex items-center gap-2"
                          >
                            {MedalIcon ? (
                              <MedalIcon className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground w-4 text-center flex-shrink-0">
                                {row.place}
                              </span>
                            )}
                            <span className="text-sm font-medium flex-1 min-w-0 truncate">
                              {row.player.name}
                            </span>
                            <span className="text-sm text-muted-foreground flex-1 border-border pl-2 text-center min-w-[80px]">
                              {row.wins}-{row.losses}
                            </span>
                            <span className="text-sm font-semibold text-primary border-border pl-2 text-right min-w-[60px]">
                              {row.pointsWon}-{row.pointsLost}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Middle Column - Second Half of Players */}
                {playerTableData.length > 0 && (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[50%]">
                        {t("events.table.player")}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-border pl-2 text-center min-w-[80px]">
                        {t("events.table.gamesWL")}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-border pl-2 text-right min-w-[80px]">
                        {t("events.table.pointsWL")}
                      </span>
                    </div>
                    {playerTableData
                      .slice(Math.ceil(playerTableData.length / 2))
                      .map((row) => {
                        // Determine medal icon for top 3 places
                        let MedalIcon:
                          | typeof GoldMedalIcon
                          | typeof SilverMedalIcon
                          | typeof BronzeMedalIcon
                          | null = null;
                        if (row.place === 1) {
                          MedalIcon = GoldMedalIcon;
                        } else if (row.place === 2) {
                          MedalIcon = SilverMedalIcon;
                        } else if (row.place === 3) {
                          MedalIcon = BronzeMedalIcon;
                        }

                        return (
                          <div
                            key={row.player.id}
                            className="flex items-center gap-2"
                          >
                            {MedalIcon ? (
                              <MedalIcon className="h-4 w-4 flex-shrink-0" />
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground w-4 text-center flex-shrink-0">
                                {row.place}
                              </span>
                            )}
                            <span className="text-sm font-medium flex-1 min-w-0 truncate">
                              {row.player.name}
                            </span>
                            <span className="text-sm text-muted-foreground flex-1 border-border pl-2 text-center">
                              {row.wins}-{row.losses}
                            </span>
                            <span className="text-sm font-semibold text-primary border-border pl-2 text-right">
                              {row.pointsWon}-{row.pointsLost}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}

                {/* Right Column - Highlights */}
                {highlights.length > 0 && (
                  <div className="space-y-2">
                    <h4
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
                      suppressHydrationWarning
                    >
                      {t("events.highlights")}
                    </h4>
                    {highlights.map((highlight, idx) => (
                      <Badge
                        key={`${highlight.player.id}-${highlight.type}-${idx}`}
                        variant="outline"
                        className={cn(
                          "text-[11px] px-2 py-1 w-full justify-start",
                          highlight.type === "streak" &&
                            "border-green-500/50 text-green-400",
                          highlight.type === "noWins" &&
                            "border-red-500/50 text-red-400",
                          highlight.type === "perfect" &&
                            "border-blue-500/50 text-blue-400",
                        )}
                      >
                        {highlight.type === "streak" && (
                          <>
                            <TrendingUp className="h-2.5 w-2.5 mr-1.5 flex-shrink-0" />
                            <span className="truncate" suppressHydrationWarning>
                              {t("events.highlightsText.winsInRow", {
                                player: highlight.player.name.split(" ")[0],
                                value: highlight.value,
                              })}
                            </span>
                          </>
                        )}
                        {highlight.type === "noWins" && (
                          <>
                            <AlertCircle className="h-2.5 w-2.5 mr-1.5 flex-shrink-0" />
                            <span className="truncate" suppressHydrationWarning>
                              {t("events.highlightsText.noWins", {
                                player: highlight.player.name.split(" ")[0],
                                value: highlight.value,
                              })}
                            </span>
                          </>
                        )}
                        {highlight.type === "perfect" && (
                          <>
                            <Trophy className="h-2.5 w-2.5 mr-1.5 flex-shrink-0" />
                            <span className="truncate" suppressHydrationWarning>
                              {t("events.highlightsText.perfect", {
                                player: highlight.player.name.split(" ")[0],
                                value: highlight.value,
                              })}
                            </span>
                          </>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legacy Winners Display (for backward compatibility) */}
          {event.status === "completed" &&
            event.winners.length > 0 &&
            !event.places && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {event.winners.map((winner) => (
                      <Avatar
                        key={winner.id}
                        className="h-6 w-6 border-2 border-background"
                      >
                        <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-semibold">
                          {getInitials(winner.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs font-medium">
                    {event.winners.map((w) => w.name.split(" ")[0]).join(" & ")}
                  </span>
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}

// Map backend EventResponseDto to frontend Event interface
function mapBackendEventToFrontend(
  backendEvent: BackendEventResponseDto,
  gamesByEventId: Record<string, BackendGameResponseDto[]>,
  playersById: Record<string, Player>,
): EventWithPlaces {
  const dateField =
    (backendEvent as unknown as { startDate?: string; date?: string })[
      "date"
    ] ||
    (backendEvent as unknown as { startDate?: string; date?: string })[
      "startDate"
    ];
  const date = new Date(dateField as string).toISOString();

  // Extract winners from data.gold or data["1"] (for backward compatibility)
  const winners: Player[] = [];
  const winnersKey = backendEvent.data?.["1"];
  if (winnersKey && Array.isArray(winnersKey)) {
    for (const playerId of winnersKey) {
      const player = playersById[playerId];
      if (player) {
        winners.push(player);
      }
    }
  }

  // Extract places (all places, not just top 3)
  const places = extractEventPlaces(backendEvent, playersById);

  // Get games for this event and map them
  const backendGames = gamesByEventId[backendEvent.id] || [];
  const games: Game[] = backendGames
    .map((backendGame) => mapBackendGameToFrontend(backendGame, playersById))
    .filter((game): game is Game => game !== null);

  // Calculate player statistics
  const playerStats =
    games.length > 0 ? calculatePlayerEventStats(games, playersById) : [];

  // Calculate player points from backend games (more accurate)
  const playerPoints =
    backendGames.length > 0
      ? calculatePlayerPointsFromBackendGames(backendGames, playersById)
      : [];

  // Calculate summary statistics from backend games
  const summaryStats =
    backendGames.length > 0
      ? calculateEventSummaryStatsFromBackendGames(backendGames, places)
      : undefined;

  return {
    id: backendEvent.id,
    name: backendEvent.name,
    startDate: date,
    endDate: date,
    location: backendEvent.location || "",
    games: games,
    winners: winners,
    status: "completed",
    places: places || [],
    playerStats: playerStats.length > 0 ? playerStats : undefined,
    playerPoints: playerPoints.length > 0 ? playerPoints : undefined,
    summaryStats: summaryStats,
  };
}

export default function EventsPage() {
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [allEvents, setAllEvents] = useState<Record<number, Event[]>>({
    1: [],
  });

  const { data: gamesData, isLoading: isLoadingGames } = useQuery<{
    games: BackendGameResponseDto[];
    allGamesCount: number;
  }>({
    queryKey: ["games"],
    queryFn: () => fetch(API.GET_ALL_GAMES).then((res) => res.json()),
  });

  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<
    Player[]
  >({
    queryKey: ["players"],
    queryFn: () => fetch(API.GET_ALL_PLAYERS).then((res) => res.json()),
  });

  const gamesByEventId =
    gamesData?.games?.reduce(
      (acc, game) => {
        if (!acc[game.eventId]) {
          acc[game.eventId] = [];
        }
        acc[game.eventId].push(game);
        return acc;
      },
      {} as Record<string, BackendGameResponseDto[]>,
    ) || {};

  const playersById = players.reduce(
    (acc, player) => {
      acc[player.id] = player;
      return acc;
    },
    {} as Record<string, Player>,
  );

  const getEvents = (page: number) =>
    fetch(`${API.GET_ALL_EVENTS}?page=${page}`).then(async (res) => {
      const { events, page, hasMore } = await res.json();
      setIsLoading(false);
      setHasMore(hasMore);
      setAllEvents((prev) => ({
        ...prev,
        [page]: events,
      }));
      return { events, page, hasMore };
    });

  // Fetch events from API
  const { data: backendEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["events"],
    queryFn: () => getEvents(1),
  });

  useEffect(() => {
    if (backendEvents?.events.length && allEvents[page]?.length) {
      return;
    }

    setAllEvents((prev) => ({
      ...prev,
      [page]: backendEvents?.events || [],
    }));
  }, [backendEvents]);

  useEffect(() => {
    setIsLoading(isLoadingEvents || isLoadingGames || isLoadingPlayers);
  }, [isLoadingEvents, isLoadingGames, isLoadingPlayers]);

  const events = (allEvents[page] || []).map((event: any) =>
    mapBackendEventToFrontend(event, gamesByEventId, playersById),
  );

  const handlePageChange = (page: number) => {
    setPage(page);
    if (!allEvents[page]?.length) {
      setIsLoading(true);
      getEvents(page);
    }
  };

  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold tracking-tight"
            suppressHydrationWarning
          >
            {t("events.title")}
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground" suppressHydrationWarning>
              {t("events.loading")}
            </p>
          </div>
        ) : (
          <>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </>
        )}
      </main>
      <div className="flex justify-center gap-2 my-4">
        {page !== 1 && (
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Button disabled>{page}</Button>
        {hasMore && (
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasMore}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
