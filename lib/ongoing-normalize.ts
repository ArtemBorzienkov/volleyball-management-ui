import type { OngoingEvent, OngoingEventListItem, OngoingOpenEvent } from '@/lib/types'

// The API is deployed separately from this app, so the backend answering right now may predate the
// solo-pool fields — and `.env` ships pointing at a remote host, so that skew is the normal state
// during a deploy, not an edge case. Filling the gaps here, at the fetch boundary, is what keeps
// every component below free of `?? []` and stops a missing array from throwing mid-render.
type Older<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type OlderOngoingEventListItem = Older<
  OngoingEventListItem,
  'teams' | 'soloPlayers' | 'createdBy' | 'visibility'
>
export type OlderOngoingOpenEvent = Older<
  OngoingOpenEvent,
  'soloPlayers' | 'visibility' | 'allowSoloRegistration' | 'createdByUserId'
>
export type OlderOngoingEvent = Omit<OngoingEvent, 'soloPlayers' | 'config'> &
  Partial<Pick<OngoingEvent, 'soloPlayers'>> & {
    config: Older<OngoingEvent['config'], 'visibility' | 'allowSoloRegistration'>
  }

export function normalizeOngoingListItem(raw: OlderOngoingEventListItem): OngoingEventListItem {
  return {
    ...raw,
    createdBy: raw.createdBy ?? null,
    visibility: raw.visibility ?? 'public',
    teams: raw.teams ?? [],
    soloPlayers: raw.soloPlayers ?? [],
  }
}

export function normalizeOngoingOpenEvent(raw: OlderOngoingOpenEvent): OngoingOpenEvent {
  return {
    ...raw,
    // An older backend has no notion of private tournaments, so its events are all public.
    visibility: raw.visibility ?? 'public',
    allowSoloRegistration: raw.allowSoloRegistration ?? false,
    createdByUserId: raw.createdByUserId ?? null,
    soloPlayers: raw.soloPlayers ?? [],
  }
}

export function normalizeOngoingEvent(raw: OlderOngoingEvent): OngoingEvent {
  return {
    ...raw,
    config: {
      ...raw.config,
      visibility: raw.config.visibility ?? 'public',
      allowSoloRegistration: raw.config.allowSoloRegistration ?? false,
    },
    soloPlayers: raw.soloPlayers ?? [],
  }
}
