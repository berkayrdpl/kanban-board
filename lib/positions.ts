/**
 * Position helpers for ordered lists (columns, cards).
 *
 * Strategy: each item has a `position` (float). To insert/move:
 *   - between A and B → midpoint of A.position and B.position
 *   - at the start    → first.position - STEP
 *   - at the end      → last.position + STEP
 *   - empty list      → STEP
 *
 * Single UPDATE per move; siblings stay untouched. Float precision means
 * we can do ~52 inserts between two consecutive integers before hitting
 * floating-point issues — when that happens, call rebalance_* (see SQL).
 */

const STEP = 1024;
const REBALANCE_THRESHOLD = 1e-6;

export type HasPosition = { position: number };

/** Position to use when appending to the end of a list. */
export function getPositionAfterLast(items: HasPosition[]): number {
  if (items.length === 0) return STEP;
  const max = Math.max(...items.map((i) => i.position));
  return max + STEP;
}

/** Position to use when prepending to the start of a list. */
export function getPositionBeforeFirst(items: HasPosition[]): number {
  if (items.length === 0) return STEP;
  const min = Math.min(...items.map((i) => i.position));
  return min - STEP;
}

/** Midpoint between two siblings. */
export function getPositionBetween(prev: number, next: number): number {
  return (prev + next) / 2;
}

/**
 * Compute new position for an item dropped at `targetIndex` in a list of
 * `siblings` (already sorted ascending by position, NOT containing the item
 * being moved).
 */
export function getPositionForIndex(
  siblings: HasPosition[],
  targetIndex: number,
): number {
  if (siblings.length === 0) return STEP;
  if (targetIndex <= 0) return getPositionBeforeFirst(siblings);
  if (targetIndex >= siblings.length) return getPositionAfterLast(siblings);
  return getPositionBetween(
    siblings[targetIndex - 1].position,
    siblings[targetIndex].position,
  );
}

/**
 * Returns true if the gap between two adjacent positions has shrunk so much
 * that further inserts will lose precision. Caller should trigger a rebalance.
 */
export function shouldRebalance(prev: number, next: number): boolean {
  return Math.abs(next - prev) < REBALANCE_THRESHOLD;
}
