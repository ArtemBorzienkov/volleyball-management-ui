/**
 * Display-side masking for players who asked not to be named publicly.
 *
 * The stored name is never changed — the API returns it in full and this module decides what a viewer
 * sees. That split is deliberate: an organiser picking a partner still needs to tell two people
 * apart, so masking belongs at the point of display, not in the data.
 */

/** Characters of each word kept before the mask, e.g. "Artem Borzienkov" -> "Ar*** Bo***". */
export const VISIBLE_PREFIX_LENGTH = 2

const MASK = '***'

export interface MaskablePlayer {
  name: string
  isAnonymous?: boolean
}

/**
 * Masks every word of a name, keeping its first two characters. A word shorter than that keeps what
 * it has rather than exposing nothing to anchor on — and rather than padding, which would suggest
 * characters that are not there.
 */
export function maskPlayerName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return MASK

  return trimmed
    .split(/\s+/)
    .map((word) => `${[...word].slice(0, VISIBLE_PREFIX_LENGTH).join('')}${MASK}`)
    .join(' ')
}

/**
 * What a viewer should see for this player. Anything without the flag reads as not anonymous, so a
 * payload from a backend that predates the field shows names as before.
 */
export function playerDisplayName(player: MaskablePlayer | null | undefined): string {
  if (!player) return ''
  return player.isAnonymous ? maskPlayerName(player.name) : player.name
}

/** The initial shown in an avatar. Masked players get the mask's own marker, not their real letter. */
export function playerInitials(player: MaskablePlayer | null | undefined): string {
  if (!player) return ''
  if (player.isAnonymous) return '*'

  const words = player.name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return ''
  return words.length === 1
    ? words[0].charAt(0).toUpperCase()
    : `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase()
}
