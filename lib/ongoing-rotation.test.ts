import { describe, expect, it } from 'vitest'
import { ROTATION_MOVERS, groupLabelKey, rotationMovement } from './ongoing-rotation'

describe('rotationMovement', () => {
  it('promotes the top two of a group that has one above it', () => {
    expect(rotationMovement(1, 1, 3)).toBe('up')
    expect(rotationMovement(2, 1, 3)).toBe('up')
  })

  it('relegates the bottom two of a group that has one below it', () => {
    expect(rotationMovement(3, 1, 3)).toBe('down')
    expect(rotationMovement(4, 1, 3)).toBe('down')
  })

  it('keeps the strongest group’s top two put — there is nowhere higher', () => {
    expect(rotationMovement(1, 0, 3)).toBe('stay')
    expect(rotationMovement(2, 0, 3)).toBe('stay')
  })

  it('still relegates the strongest group’s bottom two', () => {
    expect(rotationMovement(3, 0, 3)).toBe('down')
    expect(rotationMovement(4, 0, 3)).toBe('down')
  })

  it('keeps the weakest group’s bottom two put — there is nowhere lower', () => {
    expect(rotationMovement(3, 2, 3)).toBe('stay')
    expect(rotationMovement(4, 2, 3)).toBe('stay')
  })

  it('still promotes the weakest group’s top two', () => {
    expect(rotationMovement(1, 2, 3)).toBe('up')
    expect(rotationMovement(2, 2, 3)).toBe('up')
  })

  it('moves nobody when there is only one group', () => {
    expect([1, 2, 3, 4].map((place) => rotationMovement(place, 0, 1))).toEqual([
      'stay',
      'stay',
      'stay',
      'stay',
    ])
  })

  it('agrees with the API on how many move each way', () => {
    const places = [1, 2, 3, 4]
    const middle = places.map((place) => rotationMovement(place, 1, 3))

    expect(middle.filter((move) => move === 'up')).toHaveLength(ROTATION_MOVERS)
    expect(middle.filter((move) => move === 'down')).toHaveLength(ROTATION_MOVERS)
  })
})

describe('groupLabelKey', () => {
  it('names the ends of the ladder so promotion direction is readable', () => {
    expect(groupLabelKey(0, 3)).toBe('ongoing.rotation.groupStrongest')
    expect(groupLabelKey(2, 3)).toBe('ongoing.rotation.groupWeakest')
  })

  it('leaves a middle group numbered', () => {
    expect(groupLabelKey(1, 3)).toBe('ongoing.rotation.groupMiddle')
  })

  it('names both ends with only two groups', () => {
    expect(groupLabelKey(0, 2)).toBe('ongoing.rotation.groupStrongest')
    expect(groupLabelKey(1, 2)).toBe('ongoing.rotation.groupWeakest')
  })

  it('falls back to a plain label when there is no ladder', () => {
    expect(groupLabelKey(0, 1)).toBe('ongoing.rotation.groupPlain')
  })
})
