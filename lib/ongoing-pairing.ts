export interface SoloEntry {
  playerId: string;
  rating: number;
}

export interface DraftPair {
  player1Id: string;
  player2Id: string;
}

// Mirrors the API's pairByRating: strongest with weakest, so no team is two top seeds, with playerId
// breaking rating ties because ratings repeat constantly (every player starts at 1000).
export function pairByRating(entries: SoloEntry[]): DraftPair[] {
  const sorted = entries.slice().sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (a.playerId === b.playerId) return 0;
    return a.playerId < b.playerId ? -1 : 1;
  });

  const pairs: DraftPair[] = [];
  let low = 0;
  let high = sorted.length - 1;

  while (low < high) {
    pairs.push({ player1Id: sorted[low].playerId, player2Id: sorted[high].playerId });
    low += 1;
    high -= 1;
  }

  return pairs;
}

/** Everyone in the pool that the draft has not placed yet — an empty slot places nobody. */
export function unplacedEntries(pool: SoloEntry[], draft: DraftPair[]): SoloEntry[] {
  const placed = new Set(draft.flatMap((pair) => [pair.player1Id, pair.player2Id]));
  return pool.filter((entry) => !placed.has(entry.playerId));
}

/**
 * Fills the draft out: pairs by rating whoever the organiser has not placed by hand, and leaves the
 * hand-made pairs exactly as they are. Incomplete rows are left alone too — a half-filled row is a
 * choice in progress, not a slot to fill in from under them.
 */
export function autoPairRemaining(pool: SoloEntry[], draft: DraftPair[]): DraftPair[] {
  return [...draft, ...pairByRating(unplacedEntries(pool, draft))];
}

/** A row the organiser started but has not finished; sending it would silently drop a player. */
export function hasIncompletePair(draft: DraftPair[]): boolean {
  return draft.some((pair) => !pair.player1Id || !pair.player2Id);
}

/**
 * Ids already used elsewhere in the draft, so a slot can exclude them from its options. The slot's
 * own current value is never excluded — it has to stay visible in its own select.
 */
export function idsUsedOutside(draft: DraftPair[], index: number, slot: keyof DraftPair): Set<string> {
  const used = new Set<string>();
  draft.forEach((pair, pairIndex) => {
    (Object.keys(pair) as Array<keyof DraftPair>).forEach((key) => {
      if (pairIndex === index && key === slot) return;
      if (pair[key]) used.add(pair[key]);
    });
  });
  return used;
}
