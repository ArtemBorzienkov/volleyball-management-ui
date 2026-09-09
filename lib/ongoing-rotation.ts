// Mirrors the API's rotation module: the top two of a group go up and the bottom two go down.
export const ROTATION_MOVERS = 2

export type RotationMovement = 'up' | 'down' | 'stay'

/**
 * Which way a place in a group is heading next round. The ends of the ladder have nowhere to go, so
 * the strongest group's top places and the weakest group's bottom places stay put.
 */
export function rotationMovement(place: number, groupIndex: number, groupCount: number): RotationMovement {
  if (groupCount < 2) return 'stay'
  const isPromotionPlace = place <= ROTATION_MOVERS

  if (isPromotionPlace) return groupIndex === 0 ? 'stay' : 'up'
  return groupIndex === groupCount - 1 ? 'stay' : 'down'
}

/**
 * Groups are a strength ladder, so the first and last are named rather than numbered — "Group 1"
 * alone does not say which way promotion runs.
 */
export function groupLabelKey(groupIndex: number, groupCount: number): string {
  if (groupCount < 2) return 'ongoing.rotation.groupPlain'
  if (groupIndex === 0) return 'ongoing.rotation.groupStrongest'
  if (groupIndex === groupCount - 1) return 'ongoing.rotation.groupWeakest'
  return 'ongoing.rotation.groupMiddle'
}
