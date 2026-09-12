import { isEventToday } from '@/lib/ongoing-date'

/**
 * Whether the tabs that only matter while a tournament is being played — its fixtures and its final
 * places — are worth showing.
 *
 * Both conditions have to hold: a schedule has to exist, and the tournament has to be happening
 * today. Before then the page's useful content is the roster and the rules, and those tabs are an
 * empty shell.
 */
export function shouldShowPlayDayTabs(event: { games: unknown[]; date: string }): boolean {
  return event.games.length > 0 && isEventToday(event.date)
}
