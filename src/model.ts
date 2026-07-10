import {
  FRAME_INTERVAL,
  COLS_FULL,
  COLS_SMALL,
  VIEWBOX_FULL,
  VIEWBOX_SMALL,
  PITCH,
  OFFSET,
  toSmallFrame,
} from './constants';
import type { FlickerGrids } from './schema';

export type DotKind = 'off' | 'on-static' | 'on-anim';

export interface DotModel {
  cx: number;
  cy: number;
  kind: DotKind;
  /** pattern key ('1'/'0' per frame) — only meaningful for on-anim */
  key: string;
  /** opacity at frame 0 — only meaningful for on-anim */
  initialOn: boolean;
}

export interface KeyframeModel {
  /** pattern key, unprefixed */
  key: string;
  /** the stop declarations, e.g. ["0% { opacity: 1; }", ...] */
  stops: string[];
}

export interface SpinnerModel {
  cols: number;
  viewBox: number;
  /** frame count */
  n: number;
  /** css duration string, e.g. "0.600s" */
  duration: string;
  dots: DotModel[];
  /** unique animated patterns, in first-seen order */
  keyframes: KeyframeModel[];
}

/**
 * Compute the render model for a spinner. Framework-agnostic and pure: the
 * live <FlickerSpinner> component and the app's code-export functions both
 * build from this, so geometry, timing, and keyframe math can never diverge.
 */
export function computeModel(grids: FlickerGrids, small = false): SpinnerModel {
  const frames = small ? grids.map(toSmallFrame) : grids;
  const n = frames.length;
  const cols = small ? COLS_SMALL : COLS_FULL;
  const viewBox = small ? VIEWBOX_SMALL : VIEWBOX_FULL;
  const totalDots = frames[0].length;
  const duration = `${((n * FRAME_INTERVAL) / 1000).toFixed(3)}s`;

  // per-dot on/off sequence across frames
  const dotPatterns = Array.from({ length: totalDots }, (_, i) =>
    frames.map((f) => f[i]),
  );

  // unique animated patterns (not all-off, not all-on), first-seen order
  const uniquePatterns = new Map<string, boolean[]>();
  for (const pattern of dotPatterns) {
    const key = pattern.map((v) => (v ? '1' : '0')).join('');
    if (pattern.some((v) => v) && !pattern.every((v) => v) && !uniquePatterns.has(key)) {
      uniquePatterns.set(key, pattern);
    }
  }

  const keyframes: KeyframeModel[] = Array.from(uniquePatterns.entries()).map(
    ([key, pattern]) => ({ key, stops: buildStops(pattern, n) }),
  );

  const dots: DotModel[] = [];
  for (let i = 0; i < totalDots; i++) {
    const cx = (i % cols) * PITCH + OFFSET;
    const cy = Math.floor(i / cols) * PITCH + OFFSET;
    const pattern = dotPatterns[i];
    const key = pattern.map((v) => (v ? '1' : '0')).join('');
    const neverOn = pattern.every((v) => !v);
    const alwaysOn = pattern.every((v) => v);

    if (neverOn) dots.push({ cx, cy, kind: 'off', key: '', initialOn: false });
    else if (alwaysOn) dots.push({ cx, cy, kind: 'on-static', key: '', initialOn: true });
    else dots.push({ cx, cy, kind: 'on-anim', key, initialOn: pattern[0] });
  }

  return { cols, viewBox, n, duration, dots, keyframes };
}

/** Build the opacity keyframe stops for one animated dot pattern. */
function buildStops(pattern: boolean[], n: number): string[] {
  const stops: string[] = [`0% { opacity: ${pattern[0] ? 1 : 0}; }`];
  for (let i = 1; i < n; i++) {
    const pct = (i * 100) / n;
    if (pattern[i] !== pattern[i - 1]) {
      stops.push(`${(pct - 0.01).toFixed(2)}% { opacity: ${pattern[i - 1] ? 1 : 0}; }`);
      stops.push(`${pct.toFixed(2)}% { opacity: ${pattern[i] ? 1 : 0}; }`);
    }
  }
  stops.push(`100% { opacity: ${pattern[n - 1] ? 1 : 0}; }`);
  return stops;
}
