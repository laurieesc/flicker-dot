import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FlickerSpinner } from '../src/FlickerSpinner';
import { computeModel } from '../src/model';
import {
  DOTS_FULL,
  DOTS_SMALL,
  VIEWBOX_FULL,
  VIEWBOX_SMALL,
  SIZE_FULL,
  SIZE_SMALL,
  DEFAULT_ON,
  DEFAULT_OFF,
} from '../src/constants';
import type { FlickerVariant } from '../src/FlickerSpinner';
import type { FlickerGrids } from '../src/schema';
import { allOff, allOn, singleDot, alternating, mixed } from './fixtures';

function circleCount(html: string) {
  return (html.match(/<circle\b/g) ?? []).length;
}
function onCircleCount(html: string) {
  return (html.match(/<circle[^>]*\bclass="on"/g) ?? []).length;
}
// Full tags for .on circles, in the ON layer's render order (model.dots
// index order, skipping 'off'), so each can be zipped against its model dot.
function onCircleTags(html: string) {
  return html.match(/<circle[^>]*\bclass="on"[^>]*>/g) ?? [];
}
// Only the <svg data-fk="..."> HTML attribute, not the `[data-fk="..."]`
// CSS selector text repeated inside the <style> block.
function scopeIds(html: string) {
  return [...html.matchAll(/<svg[^>]*\sdata-fk="([^"]+)"/g)].map((m) => m[1]);
}
function scopeId(html: string) {
  const id = scopeIds(html)[0];
  if (!id) throw new Error('no data-fk scope id found');
  return id;
}
// Only `animation:` inside a `style="..."` attribute (the shorthand on an
// animated circle), not the `animation:none!important` text that lives in
// the <style> block's reduced-motion rule.
function inlineAnimationNames(html: string) {
  const names: string[] = [];
  for (const attr of html.matchAll(/\sstyle="([^"]*)"/g)) {
    const m = attr[1].match(/(?:^|;)animation:([^;]+)/);
    if (m) names.push(m[1].trim().split(/\s+/)[0]);
  }
  return names;
}
function definedKeyframeNames(html: string) {
  return [...html.matchAll(/@keyframes\s+([^\s{]+)\s*\{/g)].map((m) => m[1]);
}

const FIXTURES: Record<string, () => FlickerGrids> = {
  allOff: () => allOff(4),
  allOn: () => allOn(4),
  singleDot: () => singleDot(24),
  alternating: () => alternating(4),
  mixed: () => mixed(),
};
const VARIANTS: FlickerVariant[] = ['7x7', '5x5'];

describe('circle-count invariant (render agrees with model)', () => {
  for (const [name, build] of Object.entries(FIXTURES)) {
    for (const variant of VARIANTS) {
      it(`${name} / ${variant}`, () => {
        const grids = build();
        const small = variant === '5x5';
        const model = computeModel(grids, small);
        const DOTS = small ? DOTS_SMALL : DOTS_FULL;
        const html = renderToStaticMarkup(<FlickerSpinner grids={grids} variant={variant} />);

        const onDots = model.dots.filter((d) => d.kind !== 'off').length;

        expect(circleCount(html)).toBe(DOTS + onDots);
        expect(onCircleCount(html)).toBe(onDots);
        expect(circleCount(html) - onCircleCount(html)).toBe(DOTS); // backing layer
      });
    }
  }
});

describe('kind mapping', () => {
  it('allOff: no .on circles, full backing layer', () => {
    const html = renderToStaticMarkup(<FlickerSpinner grids={allOff(4)} />);
    expect(onCircleCount(html)).toBe(0);
    expect(circleCount(html)).toBe(DOTS_FULL);
  });

  it('allOn: every dot .on, none animated', () => {
    const html = renderToStaticMarkup(<FlickerSpinner grids={allOn(4)} />);
    expect(onCircleCount(html)).toBe(DOTS_FULL);
    // on-static circles carry no `animation:` shorthand at all.
    expect(inlineAnimationNames(html)).toHaveLength(0);
  });

  it('singleDot(24): exactly one .on circle, animated, not lit at frame 0', () => {
    const html = renderToStaticMarkup(<FlickerSpinner grids={singleDot(24)} />);
    expect(onCircleCount(html)).toBe(1);
    expect(inlineAnimationNames(html)).toHaveLength(1);
    // the one .on circle carries opacity="0" (dot lights on frame 1, not frame 0).
    expect(html).toMatch(/<circle[^>]*class="on"[^>]*opacity="0"/);
  });

  it('mixed: dot 24 is on-static; every animated circle opacity matches its frame-0 state', () => {
    const grids = mixed();
    const model = computeModel(grids, false);
    const html = renderToStaticMarkup(<FlickerSpinner grids={grids} />);

    expect(model.dots[24].kind).toBe('on-static');

    // ON layer renders in model.dots index order, skipping 'off' — zip the
    // rendered .on tags against the same-ordered non-off model dots.
    const onDots = model.dots.filter((d) => d.kind !== 'off');
    const tags = onCircleTags(html);
    expect(tags).toHaveLength(onDots.length);

    onDots.forEach((d, i) => {
      if (d.kind === 'on-static') {
        expect(tags[i]).not.toContain('opacity=');
        expect(tags[i]).not.toContain('animation:');
      } else {
        expect(tags[i]).toContain(`opacity="${d.initialOn ? 1 : 0}"`);
        expect(tags[i]).toContain('animation:');
      }
    });

    const animCount = onDots.filter((d) => d.kind === 'on-anim').length;
    expect(inlineAnimationNames(html)).toHaveLength(animCount);
  });
});

describe('keyframes and scoping', () => {
  it('one @keyframes block per unique animated pattern, matching the model', () => {
    const grids = mixed();
    const model = computeModel(grids, false);
    const html = renderToStaticMarkup(<FlickerSpinner grids={grids} />);
    const uid = scopeId(html);

    const names = definedKeyframeNames(html);
    expect(names).toHaveLength(model.keyframes.length);
    for (const k of model.keyframes) {
      expect(html).toContain(`@keyframes ${uid}_${k.key}`);
    }
  });

  it('every inline animation name resolves to a defined @keyframes block', () => {
    const html = renderToStaticMarkup(<FlickerSpinner grids={mixed()} />);
    const used = new Set(inlineAnimationNames(html));
    const defined = new Set(definedKeyframeNames(html));
    for (const name of used) {
      expect(defined.has(name)).toBe(true);
    }
  });

  it('two instances in one tree get different scope ids', () => {
    const grids = singleDot(24);
    const html = renderToStaticMarkup(
      <>
        <FlickerSpinner grids={grids} />
        <FlickerSpinner grids={grids} />
      </>,
    );
    const ids = scopeIds(html);
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});

describe('props', () => {
  it('playing=false pauses every animated circle', () => {
    const html = renderToStaticMarkup(<FlickerSpinner grids={singleDot(24)} playing={false} />);
    expect(html).toContain('animation-play-state:paused');
    expect(html).not.toContain('animation-play-state:running');
  });

  it('playing defaults to running', () => {
    const html = renderToStaticMarkup(<FlickerSpinner grids={singleDot(24)} />);
    expect(html).toContain('animation-play-state:running');
  });

  it('reverse adds animation-direction:reverse; absent by default', () => {
    const html = renderToStaticMarkup(<FlickerSpinner grids={singleDot(24)} reverse />);
    expect(html).toContain('animation-direction:reverse');

    const def = renderToStaticMarkup(<FlickerSpinner grids={singleDot(24)} />);
    expect(def).not.toContain('animation-direction');
  });

  it('speed scales --dur; speed<=0 clamps to the base duration', () => {
    const grids = allOn(4); // base duration: (4*150/1000).toFixed(3) = 0.600s
    const fast = renderToStaticMarkup(<FlickerSpinner grids={grids} speed={2} />);
    expect(fast).toContain('--dur:0.300s');

    const zero = renderToStaticMarkup(<FlickerSpinner grids={grids} speed={0} />);
    expect(zero).toContain('--dur:0.600s');

    const negative = renderToStaticMarkup(<FlickerSpinner grids={grids} speed={-1} />);
    expect(negative).toContain('--dur:0.600s');
  });

  it('color precedence: explicit props beat theme beat defaults', () => {
    const grids = allOff(1);

    const def = renderToStaticMarkup(<FlickerSpinner grids={grids} />);
    expect(def).toContain(`--on:${DEFAULT_ON}`);
    expect(def).toContain(`--off:${DEFAULT_OFF}`);

    const themed = renderToStaticMarkup(
      <FlickerSpinner grids={grids} theme={{ on: '#111111', off: '#eeeeee' }} />,
    );
    expect(themed).toContain('--on:#111111');
    expect(themed).toContain('--off:#eeeeee');

    const explicit = renderToStaticMarkup(
      <FlickerSpinner
        grids={grids}
        onColor="#ff0000"
        offColor="#00ff00"
        theme={{ on: '#111111', off: '#eeeeee' }}
      />,
    );
    expect(explicit).toContain('--on:#ff0000');
    expect(explicit).toContain('--off:#00ff00');
  });

  it('fit maps to the right preserveAspectRatio', () => {
    const grids = allOff(1);
    expect(renderToStaticMarkup(<FlickerSpinner grids={grids} />)).toContain(
      'preserveAspectRatio="xMidYMid meet"',
    );
    expect(renderToStaticMarkup(<FlickerSpinner grids={grids} fit="cover" />)).toContain(
      'preserveAspectRatio="xMidYMid slice"',
    );
    expect(renderToStaticMarkup(<FlickerSpinner grids={grids} fit="fill" />)).toContain(
      'preserveAspectRatio="none"',
    );
  });

  it('variant controls viewBox and default size', () => {
    const grids = allOff(1);
    const full = renderToStaticMarkup(<FlickerSpinner grids={grids} variant="7x7" />);
    expect(full).toContain(`viewBox="0 0 ${VIEWBOX_FULL} ${VIEWBOX_FULL}"`);
    expect(full).toContain(`width="${SIZE_FULL}"`);

    const small = renderToStaticMarkup(<FlickerSpinner grids={grids} variant="5x5" />);
    expect(small).toContain(`viewBox="0 0 ${VIEWBOX_SMALL} ${VIEWBOX_SMALL}"`);
    expect(small).toContain(`width="${SIZE_SMALL}"`);

    const overridden = renderToStaticMarkup(<FlickerSpinner grids={grids} size={64} />);
    expect(overridden).toContain('width="64"');
    expect(overridden).toContain('height="64"');
  });

  it('title sets aria-label and <title>; defaults to Loading', () => {
    const grids = allOff(1);
    const def = renderToStaticMarkup(<FlickerSpinner grids={grids} />);
    expect(def).toContain('aria-label="Loading"');
    expect(def).toContain('<title>Loading</title>');

    const custom = renderToStaticMarkup(<FlickerSpinner grids={grids} title="Saving" />);
    expect(custom).toContain('aria-label="Saving"');
    expect(custom).toContain('<title>Saving</title>');
  });
});

describe('reduced motion', () => {
  it('emits a prefers-reduced-motion block scoped to this instance', () => {
    const html = renderToStaticMarkup(<FlickerSpinner grids={singleDot(24)} />);
    const uid = scopeId(html);
    expect(html).toContain(
      `@media (prefers-reduced-motion: reduce){[data-fk="${uid}"] circle{animation:none!important}}`,
    );
  });
});
