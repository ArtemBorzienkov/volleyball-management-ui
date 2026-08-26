export function canManageOngoingEvent(
  user: { id: string; role: string } | null,
  createdByUserId: string | null,
): boolean {
  if (!user) return false
  return user.role === 'admin' || user.id === createdByUserId
}
