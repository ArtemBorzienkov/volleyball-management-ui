import { describe, expect, it } from 'vitest'
import { shouldShowPlayDayTabs } from './ongoing-tabs'

/** The API stores a tournament date as UTC midnight of the chosen calendar day. */
const dayOf = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString()

const today = dayOf(new Date())
const tomorrow = dayOf(new Date(Date.now() + 24 * 60 * 60 * 1000))
const yesterday = dayOf(new Date(Date.now() - 24 * 60 * 60 * 1000))

describe('shouldShowPlayDayTabs', () => {
  it('shows them when a schedule exists and the tournament is today', () => {
    expect(shouldShowPlayDayTabs({ games: [{}], date: today })).toBe(true)
  })

  it('hides them before a schedule has been generated, even on the day', () => {
    expect(shouldShowPlayDayTabs({ games: [], date: today })).toBe(false)
  })

  it('hides them on a future tournament that already has a schedule', () => {
    expect(shouldShowPlayDayTabs({ games: [{}], date: tomorrow })).toBe(false)
  })

  it('hides them once the day has passed', () => {
    expect(shouldShowPlayDayTabs({ games: [{}], date: yesterday })).toBe(false)
  })

  it('needs both conditions, not either', () => {
    expect(shouldShowPlayDayTabs({ games: [], date: tomorrow })).toBe(false)
    expect(shouldShowPlayDayTabs({ games: [], date: yesterday })).toBe(false)
  })

  it('counts an unplayed fixture as a schedule — the tabs are how you enter results', () => {
    expect(shouldShowPlayDayTabs({ games: [{ team1Points: null }], date: today })).toBe(true)
  })
})
