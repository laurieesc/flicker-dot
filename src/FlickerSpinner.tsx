import { useId } from 'react';
import type { CSSProperties } from 'react';
import { computeModel } from './model';
import type { FlickerGrids } from './schema';
import { DOT_R, SIZE_FULL, SIZE_SMALL, DEFAULT_ON, DEFAULT_OFF } from './constants';

export type FlickerVariant = '7x7' | '5x5';

export interface FlickerSpinnerProps {
  /** Ordered frames; each frame is a flat 49-boolean (7x7) array. */
  grids: FlickerGrids;
  /** ON dot color (any CSS color). Default #262626. */
  onColor?: string;
  /** OFF dot color (any CSS color). Default #e5e5e5. */
  offColor?: string;
  /** Render the full 7x7 or the derived inner 5x5. Default '7x7'. */
  variant?: FlickerVariant;
  /** Render size in px. Defaults to 28 (7x7) / 16 (5x5). */
  size?: number;
  /** Whether the animation runs. Default true. */
  playing?: boolean;
  /** Accessible title. Default 'Loading'. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Flicker dot-grid loading spinner. Pure CSS-keyframe animation — no JS timer,
 * no re-renders. Styles are scoped to each instance, so multiple spinners and
 * the host page never collide. Honors prefers-reduced-motion.
 */
export function FlickerSpinner({
  grids,
  onColor = DEFAULT_ON,
  offColor = DEFAULT_OFF,
  variant = '7x7',
  size,
  playing = true,
  title = 'Loading',
  className,
  style,
}: FlickerSpinnerProps) {
  const small = variant === '5x5';
  const model = computeModel(grids, small);
  const px = size ?? (small ? SIZE_SMALL : SIZE_FULL);

  // Scope id — sanitized so it's a valid CSS ident / animation-name fragment.
  const uid = 'fk' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const kf = (key: string) => `${uid}_${key}`;
  const playState = playing ? 'running' : 'paused';

  const css =
    `[data-fk="${uid}"] circle{fill:var(--off)}` +
    `[data-fk="${uid}"] circle.on{fill:var(--on)}` +
    `@media (prefers-reduced-motion: reduce){[data-fk="${uid}"] circle{animation:none!important}}` +
    model.keyframes
      .map((k) => `@keyframes ${kf(k.key)}{${k.stops.join(' ')}}`)
      .join('');

  return (
    <svg
      data-fk={uid}
      width={px}
      height={px}
      viewBox={`0 0 ${model.viewBox} ${model.viewBox}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
      style={{ '--on': onColor, '--off': offColor, '--dur': model.duration, ...style } as CSSProperties}
    >
      <title>{title}</title>
      <style>{css}</style>
      {model.dots.map((d, i) => {
        if (d.kind === 'off') {
          return <circle key={i} cx={d.cx} cy={d.cy} r={DOT_R} />;
        }
        if (d.kind === 'on-static') {
          return <circle key={i} className="on" cx={d.cx} cy={d.cy} r={DOT_R} />;
        }
        return (
          <circle
            key={i}
            className="on"
            cx={d.cx}
            cy={d.cy}
            r={DOT_R}
            opacity={d.initialOn ? 1 : 0}
            style={{ animation: `${kf(d.key)} var(--dur) linear infinite`, animationPlayState: playState }}
          />
        );
      })}
    </svg>
  );
}

