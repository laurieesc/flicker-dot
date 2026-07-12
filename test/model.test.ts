import { describe, expect, it } from 'vitest';
import { computeModel } from '../src/model';
import { toSmallFrame } from '../src/constants';
import { DOTS_FULL, SAFE_AREA_INDICES } from '../src/constants';
import type { FlickerGrids } from '../src/schema';
import { allOff, allOn, alternating, singleDot } from './fixtures';

describe('duration', () => {
  it('n frames -> (n*150/1000).toFixed(3) + "s"', () => {
    for (const n of [1, 3, 4, 6, 10]) {
      const model = computeModel(allOff(n), false);
      expect(model.duration).toBe(`${((n * 150) / 1000).toFixed(3)}s`);
    }
  });
});

describe('geometry', () => {
  it('7x7: dot i at cx=(i%7)*6+3, cy=floor(i/7)*6+3', () => {
    const model = computeModel(allOff(1), false);
    const at = (i: number) => model.dots[i];
    expect(at(0)).toMatchObject({ cx: 3, cy: 3 }); // top-left
    expect(at(6)).toMatchObject({ cx: 39, cy: 3 }); // top-right
    expect(at(42)).toMatchObject({ cx: 3, cy: 39 }); // bottom-left
    expect(at(48)).toMatchObject({ cx: 39, cy: 39 }); // bottom-right
    expect(at(24)).toMatchObject({ cx: 21, cy: 21 }); // center
  });

  it('5x5: dot i at cx=(i%5)*6+3, cy=floor(i/5)*6+3', () => {
    const model = computeModel(allOff(1), true);
    const at = (i: number) => model.dots[i];
    expect(at(0)).toMatchObject({ cx: 3, cy: 3 }); // top-left
    expect(at(4)).toMatchObject({ cx: 27, cy: 3 }); // top-right
    expect(at(20)).toMatchObject({ cx: 3, cy: 27 }); // bottom-left
    expect(at(24)).toMatchObject({ cx: 27, cy: 27 }); // bottom-right
    expect(at(12)).toMatchObject({ cx: 15, cy: 15 }); // center
  });
});

describe('kinds', () => {
  it('allOff -> every dot is off', () => {
    const model = computeModel(allOff(4), false);
    expect(model.dots.every((d) => d.kind === 'off')).toBe(true);
  });

  it('allOn -> every dot is on-static', () => {
    const model = computeModel(allOn(4), false);
    expect(model.dots.every((d) => d.kind === 'on-static')).toBe(true);
  });

  it('singleDot -> exactly one on-anim dot, rest off', () => {
    const model = computeModel(singleDot(24), false);
    const anim = model.dots.filter((d) => d.kind === 'on-anim');
    expect(anim).toHaveLength(1);
    expect(model.dots[24].kind).toBe('on-anim');
    expect(model.dots.filter((d) => d.kind === 'off')).toHaveLength(DOTS_FULL - 1);
  });
});

describe('keyframes', () => {
  it('collapses to unique patterns, excludes all-off/all-on, first-seen order', () => {
    // checkerboard: pattern depends only on (col+row) parity -> exactly 2
    // unique animated patterns across the whole grid, first found at i=0 and i=1.
    const model = computeModel(alternating(4), false);

    expect(model.keyframes).toHaveLength(2);
    expect(model.keyframes[0].key).toBe('1010');
    expect(model.keyframes[1].key).toBe('0101');

    for (const k of model.keyframes) {
      expect(k.key).not.toMatch(/^0+$/);
      expect(k.key).not.toMatch(/^1+$/);
      expect(k.stops[0]).toMatch(/^0% \{/);
      expect(k.stops[k.stops.length - 1]).toMatch(/^100% \{/);
    }
  });
});

describe('toSmallFrame', () => {
  it('extracts the inner 5x5 (25) from a full 7x7 (49) frame', () => {
    const frame = Array.from({ length: DOTS_FULL }, (_, i) => i % 2 === 0);
    const small = toSmallFrame(frame);
    expect(small).toHaveLength(25);
    expect(small).toEqual(SAFE_AREA_INDICES.map((i) => frame[i]));
  });

  it('SAFE_AREA_INDICES: 25 entries, min 8, max 40', () => {
    expect(SAFE_AREA_INDICES).toHaveLength(25);
    expect(Math.min(...SAFE_AREA_INDICES)).toBe(8);
    expect(Math.max(...SAFE_AREA_INDICES)).toBe(40);
  });
});

describe('5x5 keyframe collapse', () => {
  it('small model has fewer keyframes when the extra pattern diversity lives on the outer ring', () => {
    const n = 3;
    const innerPattern = [true, false, false]; // on at frame 0 only
    const safeSet = new Set(SAFE_AREA_INDICES);
    const grids: FlickerGrids = Array.from({ length: n }, () => Array(DOTS_FULL).fill(false));

    for (let i = 0; i < DOTS_FULL; i++) {
      const isInner = safeSet.has(i);
      for (let f = 0; f < n; f++) {
        if (isInner) {
          grids[f][i] = innerPattern[f];
        } else {
          // outer ring: split between "on at frame 1" and "on at frame 2",
          // both distinct from the shared inner pattern.
          const outerFrame = i % 2 === 0 ? 1 : 2;
          grids[f][i] = f === outerFrame;
        }
      }
    }

    const full = computeModel(grids, false);
    const small = computeModel(grids, true);

    expect(full.keyframes.length).toBe(3); // inner + 2 outer variants
    expect(small.keyframes.length).toBe(1); // only the shared inner pattern survives
    expect(small.keyframes.length).toBeLessThan(full.keyframes.length);
  });
});
