import type { CSSProperties } from "react";

const OUTER_PETALS = Array.from({ length: 16 });
const INNER_PETALS = Array.from({ length: 12 });

/** A single layered marigold flower (SVG). */
export function Marigold({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false">
      {OUTER_PETALS.map((_, i) => (
        <ellipse
          key={`o${i}`}
          cx="50"
          cy="18"
          rx="7.5"
          ry="15"
          fill="#f77f00"
          transform={`rotate(${(360 / OUTER_PETALS.length) * i} 50 50)`}
        />
      ))}
      {INNER_PETALS.map((_, i) => (
        <ellipse
          key={`i${i}`}
          cx="50"
          cy="29"
          rx="6.5"
          ry="12"
          fill="#ffb703"
          transform={`rotate(${(360 / INNER_PETALS.length) * i} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="11" fill="#ffd60a" />
      <circle cx="50" cy="50" r="5.5" fill="#f77f00" opacity="0.65" />
    </svg>
  );
}

/** A hanging marigold garland (toran) that spans the container width. */
export function MarigoldGarland({ className = "" }: { className?: string }) {
  const flowers = Array.from({ length: 13 });
  return (
    <div className={`pointer-events-none relative select-none ${className}`} aria-hidden>
      <span className="absolute inset-x-0 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-green/60 to-transparent" />
      <div className="flex justify-between">
        {flowers.map((_, i) => (
          <div
            key={i}
            className="animate-sway flex flex-col items-center"
            style={{ marginTop: i % 2 ? "0.2rem" : 0, animationDelay: `${(i % 5) * 0.25}s` }}
          >
            <span className="h-1.5 w-px bg-green/70 sm:h-2" />
            <span className="mb-0.5 h-1 w-1 rounded-full bg-green/80" />
            <Marigold className="h-5 w-5 drop-shadow-[0_2px_3px_rgba(157,2,8,0.25)] sm:h-6 sm:w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}

const MANDALA_PETALS = Array.from({ length: 12 });

/** A rangoli / mandala motif for decorative corners. Color via text-* class. */
export function Mandala({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="60" cy="60" r="54" strokeDasharray="3 7" opacity="0.7" />
        <circle cx="60" cy="60" r="44" />
        {MANDALA_PETALS.map((_, i) => (
          <path
            key={i}
            d="M60 16 C 71 34, 71 44, 60 58 C 49 44, 49 34, 60 16 Z"
            transform={`rotate(${(360 / MANDALA_PETALS.length) * i} 60 60)`}
          />
        ))}
        {MANDALA_PETALS.map((_, i) => (
          <circle
            key={`d${i}`}
            cx="60"
            cy="24"
            r="2.4"
            fill="currentColor"
            stroke="none"
            transform={`rotate(${(360 / MANDALA_PETALS.length) * i + 15} 60 60)`}
          />
        ))}
        <circle cx="60" cy="60" r="12" />
        <circle cx="60" cy="60" r="4" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/** A small lit diya (oil lamp) SVG. */
export function Diya({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden focusable="false">
      <ellipse cx="50" cy="88" rx="30" ry="5" fill="#000" opacity="0.12" />
      <path d="M18 60 Q50 92 82 60 Q66 72 50 72 Q34 72 18 60 Z" fill="#c1121f" />
      <path d="M18 60 Q50 74 82 60 Q50 66 18 60 Z" fill="#9d0208" />
      <ellipse cx="50" cy="58" rx="12" ry="4" fill="#ffd60a" />
      <g className="flame">
        <path d="M50 20 C 58 34, 58 44, 50 52 C 42 44, 42 34, 50 20 Z" fill="#f77f00" />
        <path d="M50 30 C 54 40, 54 46, 50 52 C 46 46, 46 40, 50 30 Z" fill="#ffd60a" />
      </g>
    </svg>
  );
}

/** A twinkling 4-point sparkle. Color via text-* class. */
export function Sparkle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor" aria-hidden focusable="false">
      <path d="M12 0c1.1 6.5 4.5 9.9 12 12-7.5 2.1-10.9 5.5-12 12-1.1-6.5-4.5-9.9-12-12 7.5-2.1 10.9-5.5 12-12Z" />
    </svg>
  );
}

type DecorProps = { className?: string; style?: CSSProperties };

/** Bottle rocket silhouette. Color via text-* class. */
export function Rocket({ className = "", style }: DecorProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} fill="currentColor" aria-hidden focusable="false">
      <path d="M32 4c6 6 9.5 14 9.5 23.5 0 5.4-2.8 10.3-8 14.8h-3C25.3 37.8 22.5 32.9 22.5 27.5 22.5 18 26 10 32 4Z" />
      <path d="M24 32c-4.3 2-6.8 5.4-7.2 10l7.2-3.7z" />
      <path d="M40 32c4.3 2 6.8 5.4 7.2 10l-7.2-3.7z" />
      <rect x="31" y="43" width="2" height="16" rx="1" />
    </svg>
  );
}

/** Hand sparkler silhouette. Color via text-* class. */
export function Sparkler({ className = "", style }: DecorProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden focusable="false">
      <line x1="12" y1="54" x2="34" y2="30" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <line x1="34" y1="30" x2="34" y2="15" />
        <line x1="34" y1="30" x2="46" y2="24" />
        <line x1="34" y1="30" x2="49" y2="33" />
        <line x1="34" y1="30" x2="24" y2="19" />
        <line x1="34" y1="30" x2="45" y2="15" />
        <line x1="34" y1="30" x2="21" y2="30" />
      </g>
      <circle cx="34" cy="30" r="2.6" fill="currentColor" />
    </svg>
  );
}

/** Flower pot / fountain silhouette. Color via text-* class. */
export function FlowerPot({ className = "", style }: DecorProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden focusable="false">
      <path d="M23 42h18l-2.5 14h-13z" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M32 42V15" />
        <path d="M32 30c-4-4-6-9-6-14" />
        <path d="M32 30c4-4 6-9 6-14" />
        <path d="M27 40c-3-4-5-9-5-14" />
        <path d="M37 40c3-4 5-9 5-14" />
      </g>
      <g fill="currentColor">
        <circle cx="32" cy="14" r="2" />
        <circle cx="25.5" cy="15.5" r="1.7" />
        <circle cx="38.5" cy="15.5" r="1.7" />
        <circle cx="21.5" cy="25.5" r="1.5" />
        <circle cx="42.5" cy="25.5" r="1.5" />
      </g>
    </svg>
  );
}

const CHAKKAR_SPOKES = Array.from({ length: 6 });

/** Ground spinner (chakkar) silhouette. Color via text-* class. */
export function Chakkar({ className = "", style }: DecorProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      aria-hidden
      focusable="false"
    >
      <circle cx="32" cy="32" r="20" />
      <circle cx="32" cy="32" r="6" />
      {CHAKKAR_SPOKES.map((_, i) => {
        const a = (Math.PI / 3) * i;
        const x1 = 32 + 6 * Math.cos(a);
        const y1 = 32 + 6 * Math.sin(a);
        const x2 = 32 + 20 * Math.cos(a);
        const y2 = 32 + 20 * Math.sin(a);
        const cx = 32 + 14 * Math.cos(a + 0.55);
        const cy = 32 + 14 * Math.sin(a + 0.55);
        return <path key={i} d={`M${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`} strokeLinecap="round" />;
      })}
    </svg>
  );
}

/** Single firecracker silhouette. Color via text-* class. */
export function Firecracker({ className = "", style }: DecorProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden focusable="false">
      <rect x="25" y="22" width="14" height="34" rx="5" fill="currentColor" />
      <path d="M39 22c1-5 5-7 9-11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="49" cy="10" r="2.4" fill="currentColor" />
    </svg>
  );
}

const BURST_RAYS = Array.from({ length: 12 });

/** Firework burst silhouette. Color via text-* class. */
export function Burst({ className = "", style }: DecorProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden focusable="false">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        {BURST_RAYS.map((_, i) => {
          const a = (Math.PI / 6) * i;
          return (
            <line
              key={i}
              x1={(32 + 7 * Math.cos(a)).toFixed(1)}
              y1={(32 + 7 * Math.sin(a)).toFixed(1)}
              x2={(32 + 23 * Math.cos(a)).toFixed(1)}
              y2={(32 + 23 * Math.sin(a)).toFixed(1)}
            />
          );
        })}
      </g>
      <g fill="currentColor">
        {BURST_RAYS.map((_, i) => {
          const a = (Math.PI / 6) * i;
          return (
            <circle
              key={i}
              cx={(32 + 26 * Math.cos(a)).toFixed(1)}
              cy={(32 + 26 * Math.sin(a)).toFixed(1)}
              r="2"
            />
          );
        })}
      </g>
    </svg>
  );
}

export type DecorVariant =
  | "rockets"
  | "sparklers"
  | "pots"
  | "chakkars"
  | "bursts"
  | "crackers"
  | "footer";

/**
 * Subtle festive background graphics for a section. Render as the first child of
 * a `relative isolate overflow-hidden` section; it sits behind the content.
 */
export function SectionDecor({ variant }: { variant: DecorVariant }) {
  const wrap = "pointer-events-none absolute inset-0 -z-10 overflow-hidden";
  switch (variant) {
    case "rockets":
      return (
        <div aria-hidden className={wrap}>
          <Rocket className="animate-float absolute -top-3 right-6 h-28 w-28 rotate-[16deg] text-primary/[0.07]" />
          <Rocket className="absolute bottom-2 left-5 h-20 w-20 -rotate-[22deg] text-orange/[0.06]" />
          <Sparkle className="animate-twinkle absolute left-1/3 top-10 h-5 w-5 text-yellow/25" />
        </div>
      );
    case "sparklers":
      return (
        <div aria-hidden className={wrap}>
          <Sparkler className="animate-float absolute right-8 top-4 h-24 w-24 text-orange/[0.09]" />
          <Sparkler className="absolute -bottom-2 left-6 h-20 w-20 -scale-x-100 text-primary/[0.07]" />
          <Sparkle className="animate-twinkle absolute bottom-10 right-1/4 h-4 w-4 text-gold/25" />
        </div>
      );
    case "pots":
      return (
        <div aria-hidden className={wrap}>
          <FlowerPot className="animate-float absolute -top-2 right-8 h-28 w-28 text-orange/[0.08]" />
          <FlowerPot className="absolute bottom-0 left-6 h-20 w-20 text-primary/[0.06]" />
          <Sparkle className="animate-twinkle absolute left-10 top-1/3 h-4 w-4 text-yellow/25" />
        </div>
      );
    case "chakkars":
      return (
        <div aria-hidden className={wrap}>
          <Chakkar className="animate-spin-slow absolute -top-6 right-6 h-32 w-32 text-primary/[0.06]" />
          <Chakkar className="animate-spin-slow-rev absolute -bottom-8 left-4 h-24 w-24 text-orange/[0.07]" />
        </div>
      );
    case "bursts":
      return (
        <div aria-hidden className={wrap}>
          <Burst className="animate-twinkle absolute right-10 top-6 h-28 w-28 text-orange/[0.09]" />
          <Burst className="absolute bottom-4 left-8 h-20 w-20 text-primary/[0.06]" />
          <Sparkle className="animate-twinkle absolute bottom-12 right-1/3 h-4 w-4 text-yellow/25" />
        </div>
      );
    case "crackers":
      return (
        <div aria-hidden className={wrap}>
          <Firecracker className="animate-float absolute -top-2 right-10 h-24 w-24 rotate-[10deg] text-primary/[0.07]" />
          <Firecracker className="absolute bottom-2 left-8 h-20 w-20 -rotate-[10deg] text-orange/[0.06]" />
          <Sparkle className="animate-twinkle absolute right-1/4 top-1/3 h-4 w-4 text-gold/25" />
        </div>
      );
    case "footer":
      return (
        <div aria-hidden className={wrap}>
          <Rocket className="animate-float absolute right-10 top-6 h-24 w-24 rotate-[14deg] text-white/[0.05]" />
          <Burst className="animate-twinkle absolute -bottom-4 left-8 h-28 w-28 text-yellow/[0.06]" />
          <Sparkle className="animate-twinkle absolute left-1/4 top-10 h-4 w-4 text-yellow/20" />
        </div>
      );
  }
}
