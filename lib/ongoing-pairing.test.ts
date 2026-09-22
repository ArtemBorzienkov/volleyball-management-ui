import { describe, expect, it } from 'vitest'
import {
  autoPairRemaining,
  hasIncompletePair,
  idsUsedOutside,
  pairByRating,
  unplacedEntries,
} from './ongoing-pairing'

const pool = [
  { playerId: 'a', rating: 1300 },
  { playerId: 'b', rating: 1200 },
  { playerId: 'c', rating: 1000 },
  { playerId: 'd', rating: 800 },
]

describe('pairByRating', () => {
  // Same rule as the API's pairing.ts, so "pair the rest" produces what the preview would have.
  it('pairs strongest with weakest', () => {
    expect(pairByRating(pool)).toEqual([
      { player1Id: 'a', player2Id: 'd' },
      { player1Id: 'b', player2Id: 'c' },
    ])
  })

  it('leaves the median player out of an odd pool', () => {
    const pairs = pairByRating(pool.slice(0, 3))

    expect(pairs).toEqual([{ player1Id: 'a', player2Id: 'c' }])
  })

  it('breaks a rating tie by id, not by row order', () => {
    const tied = [
      { playerId: 'z', rating: 1000 },
      { playerId: 'y', rating: 1000 },
      { playerId: 'x', rating: 1000 },
      { playerId: 'w', rating: 1000 },
    ]

    expect(pairByRating(tied)).toEqual([
      { player1Id: 'w', player2Id: 'z' },
      { player1Id: 'x', player2Id: 'y' },
    ])
  })

  it('pairs nobody from a pool of one or none', () => {
    expect(pairByRating([])).toEqual([])
    expect(pairByRating(pool.slice(0, 1))).toEqual([])
  })

  it('does not reorder the caller’s array', () => {
    const input = [...pool]
    pairByRating(input)

    expect(input.map((entry) => entry.playerId)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('unplacedEntries', () => {
  it('returns whoever the draft has not placed', () => {
    const left = unplacedEntries(pool, [{ player1Id: 'a', player2Id: 'c' }])

    expect(left.map((entry) => entry.playerId)).toEqual(['b', 'd'])
  })

  // An empty slot is not a placement: the player it will hold is still up for grabs.
  it('ignores empty slots', () => {
    const left = unplacedEntries(pool, [{ player1Id: 'a', player2Id: '' }])

    expect(left.map((entry) => entry.playerId)).toEqual(['b', 'c', 'd'])
  })
})

describe('autoPairRemaining', () => {
  it('keeps hand-made pairs and fills the rest by rating', () => {
    const manual = [{ player1Id: 'a', player2Id: 'b' }]

    expect(autoPairRemaining(pool, manual)).toEqual([
      { player1Id: 'a', player2Id: 'b' },
      { player1Id: 'c', player2Id: 'd' },
    ])
  })

  it('pairs the whole pool when nothing was set by hand', () => {
    expect(autoPairRemaining(pool, [])).toEqual(pairByRating(pool))
  })

  it('adds nothing when one player is left', () => {
    const manual = [{ player1Id: 'a', player2Id: 'b' }, { player1Id: 'c', player2Id: '' }]

    expect(autoPairRemaining(pool, manual)).toEqual(manual)
  })

  it('changes nothing when everyone is already placed', () => {
    const full = pairByRating(pool)

    expect(autoPairRemaining(pool, full)).toEqual(full)
  })
})

describe('hasIncompletePair', () => {
  it('spots a half-filled row', () => {
    expect(hasIncompletePair([{ player1Id: 'a', player2Id: '' }])).toBe(true)
    expect(hasIncompletePair([{ player1Id: '', player2Id: 'b' }])).toBe(true)
  })

  it('is false for complete rows and for no rows at all', () => {
    expect(hasIncompletePair([{ player1Id: 'a', player2Id: 'b' }])).toBe(false)
    expect(hasIncompletePair([])).toBe(false)
  })
})

describe('idsUsedOutside', () => {
  const draft = [
    { player1Id: 'a', player2Id: 'b' },
    { player1Id: 'c', player2Id: '' },
  ]

  it('lists everyone placed in another slot', () => {
    expect([...idsUsedOutside(draft, 1, 'player2Id')].sort()).toEqual(['a', 'b', 'c'])
  })

  // Its own value must stay selectable, or the select would render a value not in its options.
  it('never lists the slot’s own value', () => {
    expect(idsUsedOutside(draft, 0, 'player1Id').has('a')).toBe(false)
    expect(idsUsedOutside(draft, 0, 'player1Id').has('b')).toBe(true)
  })

  it('ignores empty slots', () => {
    expect(idsUsedOutside(draft, 0, 'player1Id').has('')).toBe(false)
  })
})
