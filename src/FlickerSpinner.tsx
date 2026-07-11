import { useId } from 'react';
import type { CSSProperties } from 'react';
import { computeModel } from './model';
import type { FlickerGrids } from './schema';
import { DOT_R, SIZE_FULL, SIZE_SMALL, DEFAULT_ON, DEFAULT_OFF } from './constants';

export type FlickerVariant = '7x7' | '5x5';
export type FlickerFit = 'contain' | 'cover' | 'fill';
export interface FlickerTheme {
  on: string;
  off: string;
}

export interface FlickerSpinnerProps {
  /** Ordered frames; each frame is a flat 49-boolean (7x7) array. */
  grids: FlickerGrids;
  /**
   * ON dot color — any CSS color. Pass `var(--your-var)` or `currentColor`
   * to follow the host page's light/dark theme with no JS. Default #262626.
   */
  onColor?: string;
  /** OFF dot color — any CSS color. Default #e5e5e5. */
  offColor?: string;
  /** Convenience ON/OFF pair. Explicit onColor/offColor take precedence. */
  theme?: FlickerTheme;
  /** Render the full 7x7 or the derived inner 5x5. Default '7x7'. */
  variant?: FlickerVariant;
  /** Render size in px. Defaults to 28 (7x7) / 16 (5x5). */
  size?: number;
  /** Whether the animation runs. Default true. */
  playing?: boolean;
  /** Playback rate multiplier. 1 = design speed (150ms/frame); 2 = twice as fast. Default 1. */
  speed?: number;
  /** Play frames in reverse. Default false. */
  reverse?: boolean;
  /** How the grid scales inside a non-square box. Default 'contain'. */
  fit?: FlickerFit;
  /** Accessible title. Default 'Loading'. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

const FIT_PAR: Record<FlickerFit, string> = {
  contain: 'xMidYMid meet',
  cover: 'xMidYMid slice',
  fill: 'none',
};

/**
 * Flicker dot-grid loading spinner. Pure CSS-keyframe animation — no JS timer,
 * no re-renders. Styles are scoped to each instance, so multiple spinners and
 * the host page never collide. Honors prefers-reduced-motion.
 */
export function FlickerSpinner({
  grids,
  onColor,
  offColor,
  theme,
  variant = '7x7',
  size,
  playing = true,
  speed = 1,
  reverse = false,
  fit = 'contain',
  title = 'Loading',
  className,
  style,
}: FlickerSpinnerProps) {
  const small = variant === '5x5';
  const model = computeModel(grids, small);
  const px = size ?? (small ? SIZE_SMALL : SIZE_FULL);

  // colors: explicit props win, then theme pair, then spec defaults.
  const on = onColor ?? theme?.on ?? DEFAULT_ON;
  const off = offColor ?? theme?.off ?? DEFAULT_OFF;

  // speed scales the base duration. model.duration is the single source; we
  // only divide it, so speed=1 stays byte-identical to the export. Clamp to >0.
  const s = speed > 0 ? speed : 1;
  const dur = `${(parseFloat(model.duration) / s).toFixed(3)}s`;

  // Scope id — sanitized to a valid CSS ident / animation-name fragment.
  const uid = 'fk' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const kf = (key: string) => `${uid}_${key}`;

  const animStyle: CSSProperties = {
    animationPlayState: playing ? 'running' : 'paused',
    ...(reverse ? { animationDirection: 'reverse' } : null),
  };

  const css =
    `[data-fk="${uid}"] circle{fill:var(--off)}` +
    `[data-fk="${uid}"] circle.on{fill:var(--on)}` +
    `@media (prefers-reduced-motion: reduce){[data-fk="${uid}"] circle{animation:none!important}}` +
    model.keyframes.map((k) => `@keyframes ${kf(k.key)}{${k.stops.join(' ')}}`).join('');

  return (
    <svg
      data-fk={uid}
      width={px}
      height={px}
      viewBox={`0 0 ${model.viewBox} ${model.viewBox}`}
      preserveAspectRatio={FIT_PAR[fit]}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
      style={{ '--on': on, '--off': off, '--dur': dur, ...style } as CSSProperties}
    >
      <title>{title}</title>
      <style>{css}</style>
      {/* Backing layer — every dot gets an OFF circle, so an animated dot
          fades back to OFF rather than to nothing. Matches the exporters,
          which emit an unconditional backing circle per dot. */}
      {model.dots.map((d, i) => (
        <circle key={`b${i}`} cx={d.cx} cy={d.cy} r={DOT_R} />
      ))}
      {/* ON layer — overlays the backing circle. */}
      {model.dots.map((d, i) => {
        if (d.kind === 'off') return null;
        if (d.kind === 'on-static') {
          return <circle key={`o${i}`} className="on" cx={d.cx} cy={d.cy} r={DOT_R} />;
        }
        return (
          <circle
            key={`o${i}`}
            className="on"
            cx={d.cx}
            cy={d.cy}
            r={DOT_R}
            opacity={d.initialOn ? 1 : 0}
            style={{ animation: `${kf(d.key)} var(--dur) linear infinite`, ...animStyle }}
          />
        );
      })}
    </svg>
  );
}
