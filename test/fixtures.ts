import { COLS_FULL, DOTS_FULL } from '../src/constants';
import type { FlickerGrids } from '../src/schema';

/** n frames, every dot off in every frame. */
export function allOff(n: number): FlickerGrids {
  return Array.from({ length: n }, () => Array(DOTS_FULL).fill(false));
}

/** n frames, every dot on in every frame. */
export function allOn(n: number): FlickerGrids {
  return Array.from({ length: n }, () => Array(DOTS_FULL).fill(true));
}

/** n frames; dot `d` is lit only on frame index 1, off everywhere else. */
export function singleDot(d: number, n = 4): FlickerGrids {
  return Array.from({ length: n }, (_, f) =>
    Array.from({ length: DOTS_FULL }, (_, i) => f === 1 && i === d),
  );
}

/** n frames, checkerboard pattern that also shifts by frame. */
export function alternating(n = 4): FlickerGrids {
  return Array.from({ length: n }, (_, f) =>
    Array.from({ length: DOTS_FULL }, (_, i) => {
      const col = i % COLS_FULL;
      const row = Math.floor(i / COLS_FULL);
      return (col + row + f) % 2 === 0;
    }),
  );
}

/**
 * 6 frames: one always-on dot (index 24, the 7x7 center) plus a column
 * sweep — each column lights up on exactly one frame, so most dots are
 * on-anim, column 6 never fires (off), and dot 24 is on-static.
 */
export function mixed(): FlickerGrids {
  const n = 6;
  return Array.from({ length: n }, (_, f) =>
    Array.from({ length: DOTS_FULL }, (_, i) => i === 24 || i % COLS_FULL === f % COLS_FULL),
  );
}
