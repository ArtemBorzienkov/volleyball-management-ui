"use client";

import { useTranslation } from "react-i18next";
import { OngoingMatchCard } from "@/components/ongoing/ongoing-match-card";
import { useAuth } from "@/components/providers/auth-provider";
import { canManageOngoingEvent } from "@/lib/ongoing-permissions";
import { roundLabel } from "@/lib/ongoing-bracket";
import type { OngoingEvent, OngoingGame } from "@/lib/types";

interface OngoingMatchesTabProps {
  event: OngoingEvent;
}

export function OngoingMatchesTab({ event }: OngoingMatchesTabProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = canManageOngoingEvent(user, event.createdByUserId);

  const teamsById = new Map(event.teams.map((team) => [team.id, team]));

  const groupGames = event.games.filter((game) => game.phase === "group");
  const playoffGames = event.games.filter((game) => game.phase === "playoff");
  const hasPlayoff = playoffGames.length > 0;

  const rounds = new Map<number, OngoingGame[]>();
  for (const game of groupGames) {
    const existing = rounds.get(game.round) || [];
    existing.push(game);
    rounds.set(game.round, existing);
  }
  const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b);

  const thirdPlaceGame = playoffGames.find((game) => game.thirdPlace) ?? null;
  const bracketGames = playoffGames.filter((game) => !game.thirdPlace);

  const bracketRounds = new Map<number, OngoingGame[]>();
  for (const game of bracketGames) {
    if (game.bracketRound === null) continue;
    const existing = bracketRounds.get(game.bracketRound) || [];
    existing.push(game);
    bracketRounds.set(game.bracketRound, existing);
  }
  const bracketRoundNumbers = Array.from(bracketRounds.keys()).sort((a, b) => a - b);
  const totalBracketRounds = bracketRoundNumbers.length
    ? bracketRoundNumbers[bracketRoundNumbers.length - 1]
    : 0;

  if (!groupGames.length && !hasPlayoff) {
    return (
      <p className="text-sm text-muted-foreground" suppressHydrationWarning>
        {t("ongoing.matchesTab.empty")}
      </p>
    );
  }

  const renderGame = (game: OngoingGame) => {
    if (game.team1Id === null || game.team2Id === null) return null;
    const team1 = teamsById.get(game.team1Id);
    const team2 = teamsById.get(game.team2Id);
    if (!team1 || !team2) return null;

    return <OngoingMatchCard key={game.id} game={game} team1={team1} team2={team2} canEdit={canManage} />;
  };

  return (
    <div className="flex flex-col gap-8">
      {roundNumbers.map((round) => (
        <section key={`group-${round}`} className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("ongoing.matchesTab.round")} {round}
          </h2>
          {(rounds.get(round) || []).map(renderGame)}
        </section>
      ))}

      {hasPlayoff ? (
        <>
          <h2
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            suppressHydrationWarning
          >
            {t("ongoing.matchesTab.playoffTitle")}
          </h2>
          {bracketRoundNumbers.map((round) => (
            <section key={`bracket-${round}`} className="flex flex-col gap-3">
              <h3
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                suppressHydrationWarning
              >
                {roundLabel(t, round, totalBracketRounds)}
              </h3>
              {(bracketRounds.get(round) || []).map(renderGame)}
            </section>
          ))}
          {thirdPlaceGame ? (
            <section className="flex flex-col gap-3">
              <h3
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                suppressHydrationWarning
              >
                {t("ongoing.bracket.thirdPlace")}
              </h3>
              {renderGame(thirdPlaceGame)}
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
