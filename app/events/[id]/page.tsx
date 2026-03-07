"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Trophy,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Player } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import API from "@/lib/api";
import { useTranslation } from "react-i18next";

type GamePlayerRank = { playerId: string; rank: number; rankChange: number };
type BackendGame = {
  id: string;
  team1Player1Id: string;
  team1Player2Id: string;
  team2Player1Id: string;
  team2Player2Id: string;
  team1Points: number;
  team2Points: number;
  gamePlayerRanks: GamePlayerRank[];
};
type BackendEvent = {
  id: string;
  name: string;
  date: string;
  location?: string;
  games: BackendGame[];
};
type PlayerTitleData = {
  player: Player;
  rank: number;
  rankChange: number;
  gamesWL: string;
  pointsWL: string;
};

const TeamCard = ({ name, id, rank, rankChange }: { name: string, id: string, rank: number, rankChange: number }) => (
    <div key={id} className="flex flex-wrap gap-2">
      <h1 className="text-md font-bold">{name}</h1>
      <span
        key={id}
        className="inline-flex items-center gap-2 rounded bg-muted px-2 py-0.5 text-md"
      >
        {rank}
        {rankChange >= 0 ? (
          <TrendingUp className="h-3 w-3 text-green-600" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-600" />
        )}
        {rankChange >= 0 ? `+${rankChange}` : rankChange}
      </span>
    </div>
  );

function getPlayerRankInfo(
  gamePlayerRanks: GamePlayerRank[],
  playerId: string,
): { rank: number; rankChange: number } | null {
  const info = gamePlayerRanks.find((r) => r.playerId === playerId);
  return info ? { rank: info.rank, rankChange: info.rankChange } : null;
}

const fetchEventById = async (id: string) => {
  const resp = await fetch(API.GET_EVENT_BY_ID(id));
  const data = await resp.json();
  return data;
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();

  const { data: event, isLoading: isEventLoading } = useQuery<BackendEvent>({
    queryKey: ["eventById", id],
    queryFn: () => fetchEventById(id),
  });

  const { data: players = [], isLoading: isPlayersLoading } = useQuery<
    Player[]
  >({
    queryKey: ["players"],
    queryFn: () => fetch(API.GET_ALL_PLAYERS).then((res) => res.json()),
  });

  const [playersTitleData, setPlayersTitleData] = useState<PlayerTitleData[]>(
    [],
  );

  const playersMap = new Map<string, Player>(players.map((p) => [p.id, p]));

  const getPlayersTitleData = (): PlayerTitleData[] => {
    const eventPlayersSet = new Set<string>();
    event?.games?.forEach((game) => {
      eventPlayersSet.add(game.team1Player1Id);
      eventPlayersSet.add(game.team1Player2Id);
      eventPlayersSet.add(game.team2Player1Id);
      eventPlayersSet.add(game.team2Player2Id);
    });
    const eventPlayersArray = Array.from(eventPlayersSet);

    const playersInitRankMap = new Map<string, number>(
      eventPlayersArray.map((p) => [p, 0]),
    );
    const playerIdRankChangeMap = new Map<string, number>(
      eventPlayersArray.map((p) => [p, 0]),
    );
    const playerIdGamesWLMap = new Map<string, { W: number; L: number }>(
      eventPlayersArray.map((p) => [p, { W: 0, L: 0 }]),
    );
    const playerIdPointsWLMap = new Map<string, { W: number; L: number }>(
      eventPlayersArray.map((p) => [p, { W: 0, L: 0 }]),
    );

    event?.games?.forEach((game) => {
      const {
        team1Player1Id,
        team1Player2Id,
        team2Player1Id,
        team2Player2Id,
        team1Points,
        team2Points,
      } = game;

      const isTeam1Winner = team1Points > team2Points;

      playerIdGamesWLMap.set(team1Player1Id, {
        W:
          (playerIdGamesWLMap.get(team1Player1Id)?.W ?? 0) +
          (isTeam1Winner ? 1 : 0),
        L:
          (playerIdGamesWLMap.get(team1Player1Id)?.L ?? 0) +
          (isTeam1Winner ? 0 : 1),
      });
      playerIdGamesWLMap.set(team1Player2Id, {
        W:
          (playerIdGamesWLMap.get(team1Player2Id)?.W ?? 0) +
          (isTeam1Winner ? 1 : 0),
        L:
          (playerIdGamesWLMap.get(team1Player2Id)?.L ?? 0) +
          (isTeam1Winner ? 0 : 1),
      });
      playerIdGamesWLMap.set(team2Player1Id, {
        W:
          (playerIdGamesWLMap.get(team2Player1Id)?.W ?? 0) +
          (isTeam1Winner ? 0 : 1),
        L:
          (playerIdGamesWLMap.get(team2Player1Id)?.L ?? 0) +
          (isTeam1Winner ? 1 : 0),
      });
      playerIdGamesWLMap.set(team2Player2Id, {
        W:
          (playerIdGamesWLMap.get(team2Player2Id)?.W ?? 0) +
          (isTeam1Winner ? 0 : 1),
        L:
          (playerIdGamesWLMap.get(team2Player2Id)?.L ?? 0) +
          (isTeam1Winner ? 1 : 0),
      });

      playerIdPointsWLMap.set(team1Player1Id, {
        W:
          (playerIdPointsWLMap.get(team1Player1Id)?.W ?? 0) +
          (isTeam1Winner ? team1Points : team2Points),
        L:
          (playerIdPointsWLMap.get(team1Player1Id)?.L ?? 0) +
          (isTeam1Winner ? team2Points : team1Points),
      });
      playerIdPointsWLMap.set(team1Player2Id, {
        W:
          (playerIdPointsWLMap.get(team1Player2Id)?.W ?? 0) +
          (isTeam1Winner ? team1Points : team2Points),
        L:
          (playerIdPointsWLMap.get(team1Player2Id)?.L ?? 0) +
          (isTeam1Winner ? team2Points : team1Points),
      });
      playerIdPointsWLMap.set(team2Player1Id, {
        W:
          (playerIdPointsWLMap.get(team2Player1Id)?.W ?? 0) +
          (isTeam1Winner ? team2Points : team1Points),
        L:
          (playerIdPointsWLMap.get(team2Player1Id)?.L ?? 0) +
          (isTeam1Winner ? team1Points : team2Points),
      });
      playerIdPointsWLMap.set(team2Player2Id, {
        W:
          (playerIdPointsWLMap.get(team2Player2Id)?.W ?? 0) +
          (isTeam1Winner ? team2Points : team1Points),
        L:
          (playerIdPointsWLMap.get(team2Player2Id)?.L ?? 0) +
          (isTeam1Winner ? team1Points : team2Points),
      });

      game.gamePlayerRanks.forEach(({ playerId, rank, rankChange }) => {
        if (!playersInitRankMap.get(playerId)) {
          playersInitRankMap.set(playerId, rank);
        }
        playerIdRankChangeMap.set(
          playerId,
          (playerIdRankChangeMap.get(playerId) ?? 0) + rankChange,
        );
      });
    });

    return eventPlayersArray.map((playerId) => ({
      player:
        playersMap.get(playerId) ?? ({ id: playerId, name: "" } as Player),
      rankChange: playerIdRankChangeMap.get(playerId) ?? 0,
      gamesWL: `${playerIdGamesWLMap.get(playerId)?.W ?? 0} - ${playerIdGamesWLMap.get(playerId)?.L ?? 0}`,
      pointsWL: `${playerIdPointsWLMap.get(playerId)?.W ?? 0} - ${playerIdPointsWLMap.get(playerId)?.L ?? 0}`,
      rank: playersInitRankMap.get(playerId) ?? 0,
    }));
  };

  useEffect(() => {
    if (!event?.games?.length || !players.length) {
      return;
    }
    setPlayersTitleData(getPlayersTitleData());
  }, [event, players]);

  if (isEventLoading || isPlayersLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Button size="sm" asChild className="mb-6">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>
        {/* Event Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h1 className="text-3xl font-bold">{event?.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(event?.date || "").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {event?.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event?.location}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {event?.games?.length} Games Played
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-border mt-4">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[50%]">
                  {t("events.table.player")}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-border pl-2 text-center min-w-[80px]">
                  {t("events.table.gamesWL")}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-border pl-2 text-right min-w-[80px]">
                  {t("events.table.rankChange")}
                </span>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-border pl-2 text-right min-w-[80px]">
                  {t("events.table.pointsWL")}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {playersTitleData.map((player) => (
                  <div
                    key={player.player.id}
                    className="flex items-center justify-between gap-2 mt-2"
                  >
                    <span className="w-[50%]">{player.player.name}</span>
                    <span className="w-[80px] text-center">{player.gamesWL}</span>
                    {
                      <span className="flex items-center gap-1 w-[80px] text-center">
                        {player.rankChange >= 0 ?
                        <>
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">{`+${player.rankChange}`}</span>
                        </>
                        :
                          <>
                          <TrendingDown className="h-3 w-3 text-red-600" />
                          <span className="text-red-600">{`${player.rankChange}`}</span>
                          </>
                        }
                      </span>
                    }
                    <span className="w-[80px] text-center">{player.pointsWL}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Games list */}
            <div className="mt-6 space-y-4">
              {event?.games?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No games yet</p>
              ) : (
                event?.games?.map((game) => (
                  <Card key={game.id} className="overflow-hidden p-0">
                    <CardContent className="p-0">
                      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
                        {/* Team 1 */}
                        <div className="space-y-1">
                          <div className="flex flex-col gap-2 text-md">
                            {[game.team1Player1Id, game.team1Player2Id].map(
                              (pid) => (
                                <TeamCard
                                  key={pid}
                                  name={playersMap.get(pid)?.name ?? ""}
                                  id={pid}
                                  rank={game.gamePlayerRanks.find(r => r.playerId === pid)?.rank ?? 0}
                                  rankChange={game.gamePlayerRanks.find(r => r.playerId === pid)?.rankChange ?? 0}
                                />
                              ),
                            )}
                          </div>
                        </div>

                        {/* Result */}
                        <div className="flex items-center justify-center gap-2 text-lg font-bold">
                          <span
                            className={cn(
                              game.team1Points > game.team2Points &&
                                "text-primary",
                            )}
                          >
                            {game.team1Points}
                          </span>
                          <span className="text-muted-foreground">–</span>
                          <span
                            className={cn(
                              game.team2Points > game.team1Points &&
                                "text-primary",
                            )}
                          >
                            {game.team2Points}
                          </span>
                        </div>

                        {/* Team 2 */}
                        <div className="space-y-1 text-right flex flex-col items-end">
                          <div className="flex flex-col gap-2 text-md">
                            {[game.team2Player1Id, game.team2Player2Id].map(
                              (pid) => (
                                <TeamCard
                                  key={pid}
                                  name={playersMap.get(pid)?.name ?? ""}
                                  id={pid}
                                  rank={game.gamePlayerRanks.find(r => r.playerId === pid)?.rank ?? 0}
                                  rankChange={game.gamePlayerRanks.find(r => r.playerId === pid)?.rankChange ?? 0}
                                />
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
