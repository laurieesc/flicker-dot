// Canonical geometry + timing for Flicker dot-grid spinners.
// Single source of truth — the live player, the app editor, and code export
// all derive from these. Do not fork these numbers elsewhere.

/** Frame advance interval, milliseconds. */
export const FRAME_INTERVAL = 150;

/** Dot radius in viewBox units. */
export const DOT_R = 2;
/** Center-to-center spacing in viewBox units. */
export const PITCH = 6;
/** First dot center offset from origin in viewBox units. */
export const OFFSET = 3;

export const COLS_FULL = 7;
export const COLS_SMALL = 5;
export const DOTS_FULL = 49; // 7 x 7
export const DOTS_SMALL = 25; // 5 x 5 safe area

export const VIEWBOX_FULL = 42; // 0 0 42 42
export const VIEWBOX_SMALL = 30; // 0 0 30 30

export const SIZE_FULL = 28; // default render px, 7x7
export const SIZE_SMALL = 16; // default render px, 5x5

export const DEFAULT_ON = '#262626';
export const DEFAULT_OFF = '#e5e5e5';

/**
 * Flat indices into a 49-length (7x7) frame that make up the inner 5x5 safe
 * area: rows 1..5, cols 1..5 -> row * 7 + col.
 */
export const SAFE_AREA_INDICES: readonly number[] = (() => {
  const out: number[] = [];
  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 5; col++) out.push(row * 7 + col);
  }
  return out;
})();

/** Extract the inner 5x5 (25 flat) frame from a full 7x7 (49 flat) frame. */
export function toSmallFrame(frame: boolean[]): boolean[] {
  return SAFE_AREA_INDICES.map((i) => frame[i]);
}
