import { describe, expect, it } from 'vitest'
import { maskPlayerName, playerDisplayName, playerInitials } from './player-name'

describe('maskPlayerName', () => {
  it('keeps the first two characters of each word', () => {
    expect(maskPlayerName('Artem Borzienkov')).toBe('Ar*** Bo***')
  })

  it('masks a single-word name', () => {
    expect(maskPlayerName('Art12321')).toBe('Ar***')
  })

  it('masks every word of a longer name', () => {
    expect(maskPlayerName('Jean Claude Van Damme')).toBe('Je*** Cl*** Va*** Da***')
  })

  it('keeps what a one-character word has rather than exposing nothing', () => {
    expect(maskPlayerName('A B')).toBe('A*** B***')
  })

  it('collapses irregular whitespace instead of masking empty words', () => {
    expect(maskPlayerName('  Artem   Borzienkov  ')).toBe('Ar*** Bo***')
  })

  it('returns a bare mask for an empty name', () => {
    expect(maskPlayerName('')).toBe('***')
    expect(maskPlayerName('   ')).toBe('***')
  })

  it('counts characters, not code units, so an accented or non-Latin name is not cut mid-glyph', () => {
    expect(maskPlayerName('Артем Борзієнков')).toBe('Ар*** Бо***')
    // A surrogate pair counts as one character.
    expect(maskPlayerName('😀😀😀')).toBe('😀😀***')
  })

  it('never leaks more than the prefix', () => {
    const masked = maskPlayerName('Borzienkov')
    expect(masked).toBe('Bo***')
    expect(masked).not.toContain('rzienkov')
  })
})

describe('playerDisplayName', () => {
  it('shows the real name when the player has not opted out', () => {
    expect(playerDisplayName({ name: 'Artem Borzienkov', isAnonymous: false })).toBe('Artem Borzienkov')
  })

  it('masks when the player has opted out', () => {
    expect(playerDisplayName({ name: 'Artem Borzienkov', isAnonymous: true })).toBe('Ar*** Bo***')
  })

  it('treats a missing flag as not anonymous, so an older payload renders as before', () => {
    expect(playerDisplayName({ name: 'Artem Borzienkov' })).toBe('Artem Borzienkov')
  })

  it('renders nothing for a missing player instead of throwing', () => {
    expect(playerDisplayName(null)).toBe('')
    expect(playerDisplayName(undefined)).toBe('')
  })
})

describe('playerInitials', () => {
  it('takes the first and last initial of a full name', () => {
    expect(playerInitials({ name: 'Artem Borzienkov' })).toBe('AB')
  })

  it('takes one initial from a single-word name', () => {
    expect(playerInitials({ name: 'artem' })).toBe('A')
  })

  it('hides the initial of an anonymous player — one letter is still identifying', () => {
    expect(playerInitials({ name: 'Artem Borzienkov', isAnonymous: true })).toBe('*')
  })

  it('renders nothing for a missing or empty player', () => {
    expect(playerInitials(null)).toBe('')
    expect(playerInitials({ name: '   ' })).toBe('')
  })
})
