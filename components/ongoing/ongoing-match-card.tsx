"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Check, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import API from "@/lib/api";
import { isPlayed, teamName } from "@/lib/ongoing-standings";
import type { OngoingGame, OngoingTeam } from "@/lib/types";

interface OngoingMatchCardProps {
  game: OngoingGame;
  team1: OngoingTeam;
  team2: OngoingTeam;
  canEdit: boolean;
}

export function OngoingMatchCard({ game, team1, team2, canEdit }: OngoingMatchCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const played = isPlayed(game);
  const [isEditing, setIsEditing] = useState(!played);
  const [points1, setPoints1] = useState(game.team1Points === null ? "" : String(game.team1Points));
  const [points2, setPoints2] = useState(game.team2Points === null ? "" : String(game.team2Points));

  // The list page reads its Teams/Matches/Played counters from a separate query, and the first
  // recorded score closes registration, which only /calendar's open-tournaments query can show.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["ongoing-event", game.eventId] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-events"] });
    queryClient.invalidateQueries({ queryKey: ["ongoing-open"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.UPDATE_ONGOING_GAME(game.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team1Points: Number(points1), team2Points: Number(points2) }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      invalidate();
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(API.CLEAR_ONGOING_GAME_RESULT(game.id), { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Request failed" }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      setPoints1("");
      setPoints2("");
      setIsEditing(true);
      invalidate();
    },
  });

  const trimmed1 = points1.trim();
  const trimmed2 = points2.trim();
  const parsed1 = Number(trimmed1);
  const parsed2 = Number(trimmed2);
  const isScoreValid =
    trimmed1 !== "" &&
    trimmed2 !== "" &&
    Number.isInteger(parsed1) &&
    Number.isInteger(parsed2) &&
    parsed1 >= 0 &&
    parsed2 >= 0 &&
    parsed1 !== parsed2;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-muted-foreground">
            {t("ongoing.matchesTab.court")} {game.court}
          </span>
          {canEdit && played && !isEditing && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" aria-label={t("ongoing.matchesTab.edit")} onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("ongoing.matchesTab.clear")}
                onClick={() => {
                  if (window.confirm(t("ongoing.matchesTab.clearConfirm"))) clearMutation.mutate();
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}
        </div>

        {canEdit && clearMutation.isError && (
          <p className="text-sm text-destructive">{(clearMutation.error as Error).message}</p>
        )}

        <div className="flex items-center justify-between gap-3">
          <span className="flex-1 text-right text-sm font-medium">{teamName(team1)}</span>

          {canEdit && isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                className="w-16 text-center"
                inputMode="numeric"
                value={points1}
                onChange={(changeEvent) => setPoints1(changeEvent.target.value)}
              />
              <span className="text-muted-foreground">:</span>
              <Input
                className="w-16 text-center"
                inputMode="numeric"
                value={points2}
                onChange={(changeEvent) => setPoints2(changeEvent.target.value)}
              />
            </div>
          ) : (
            <span className="min-w-24 text-center text-sm font-semibold tabular-nums">
              {played ? `${game.team1Points} : ${game.team2Points}` : "— : —"}
            </span>
          )}

          <span className="flex-1 text-sm font-medium">{teamName(team2)}</span>
        </div>

        {canEdit && isEditing && (
          <>
            {!isScoreValid && (points1 !== "" || points2 !== "") && (
              <p className="text-center text-xs text-destructive" suppressHydrationWarning>
                {t("ongoing.matchesTab.invalidScore")}
              </p>
            )}
            {saveMutation.isError && (
              <p className="text-center text-xs text-destructive">{(saveMutation.error as Error).message}</p>
            )}
            <Button
              className="self-center"
              disabled={!isScoreValid || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              <Check className="mr-2 h-4 w-4" />
              <span suppressHydrationWarning>{t("ongoing.matchesTab.save")}</span>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
