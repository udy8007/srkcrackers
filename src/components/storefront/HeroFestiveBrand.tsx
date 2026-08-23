"use client";

import { useId } from "react";

/** Soft animated firework burst used beside / behind the brand. */
export function FireworkBurst({
  className = "",
  tone = "gold",
}: {
  className?: string;
  tone?: "gold" | "red";
}) {
  const id = useId().replace(/:/g, "");
  const c1 = tone === "gold" ? "#ffc300" : "#ef233c";
  const c2 = tone === "gold" ? "#f77f00" : "#ffc300";

  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff8dc" stopOpacity="1" />
          <stop offset="35%" stopColor={c1} stopOpacity="0.85" />
          <stop offset="100%" stopColor={c2} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="hero-glow" cx="60" cy="60" r="28" fill={`url(#${id}-core)`} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (Math.PI * 2 * i) / 12;
        const x2 = 60 + Math.cos(a) * 48;
        const y2 = 60 + Math.sin(a) * 48;
        const x1 = 60 + Math.cos(a) * 14;
        const y1 = 60 + Math.sin(a) * 14;
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i % 2 ? c1 : c2}
              strokeWidth="2.2"
              strokeLinecap="round"
              className="hero-spark"
              style={{ animationDelay: `${i * 0.08}s` }}
              opacity="0.9"
            />
            <circle
              cx={x2}
              cy={y2}
              r="2.4"
              fill={i % 2 ? "#fff3a0" : c1}
              className="hero-spark"
              style={{ animationDelay: `${0.2 + i * 0.08}s` }}
            />
          </g>
        );
      })}
      <circle cx="60" cy="60" r="5" fill="#fffef2" />
    </svg>
  );
}

/** Rising sparkler trail for side decor. */
export function SparklerTrail({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 80 200" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id={`${id}-stick`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4a484" />
          <stop offset="100%" stopColor="#6b5b5b" />
        </linearGradient>
        <radialGradient id={`${id}-tip`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fffef2" />
          <stop offset="40%" stopColor="#ffc300" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ef233c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1="40" y1="70" x2="40" y2="190" stroke={`url(#${id}-stick)`} strokeWidth="3.5" strokeLinecap="round" />
      <circle className="hero-glow" cx="40" cy="48" r="28" fill={`url(#${id}-tip)`} />
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (Math.PI * 2 * i) / 10;
        return (
          <line
            key={i}
            x1={40}
            y1={48}
            x2={40 + Math.cos(a) * 22}
            y2={48 + Math.sin(a) * 22}
            stroke={i % 2 ? "#ffc300" : "#ef233c"}
            strokeWidth="1.8"
            strokeLinecap="round"
            className="hero-spark"
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        );
      })}
      {[
        [28, 30, "0s"],
        [52, 26, "0.3s"],
        [40, 18, "0.55s"],
        [22, 42, "0.8s"],
        [58, 40, "1s"],
      ].map(([x, y, d], i) => (
        <circle
          key={i}
          className="hero-rise"
          cx={x}
          cy={y}
          r={2 + (i % 2)}
          fill={i % 2 ? "#ffc300" : "#fff3a0"}
          style={{ animationDelay: String(d) }}
        />
      ))}
    </svg>
  );
}

/** Special brand frame: glow + bursts + sparkles around the title. */
export function HeroBrandSpecial({
  name,
  variant = "day",
}: {
  name: string;
  variant?: "day" | "night";
}) {
  const night = variant === "night";
  return (
    <div className="hero-brand-magic relative mx-auto mt-1 inline-flex max-w-full flex-col items-center sm:mt-2">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-[min(100%,30rem)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          background: night
            ? "radial-gradient(ellipse at center, rgba(255,195,0,0.45) 0%, rgba(239,35,60,0.18) 45%, transparent 72%)"
            : "radial-gradient(ellipse at center, rgba(255,195,0,0.35) 0%, rgba(239,35,60,0.12) 45%, transparent 70%)",
          opacity: night ? 0.95 : 0.8,
        }}
      />

      <div className="relative flex items-center justify-center gap-0.5 sm:gap-2">
        <FireworkBurst
          tone="gold"
          className="hero-bob pointer-events-none h-10 w-10 shrink-0 sm:h-14 sm:w-14 md:h-[4.25rem] md:w-[4.25rem]"
        />

        <div className="relative px-1 text-center">
          <h2
            className={`${night ? "text-festive-gold" : "text-festive"} relative z-[1] font-display text-[clamp(1.85rem,7.4vw,3.15rem)] font-extrabold leading-none tracking-tight whitespace-nowrap`}
          >
            {name}
          </h2>
          <svg
            aria-hidden
            viewBox="0 0 280 18"
            className="mx-auto mt-1.5 h-3 w-[min(100%,18rem)]"
          >
            <path
              d="M8 10 C 60 2, 120 16, 140 8 C 160 2, 220 14, 272 6"
              fill="none"
              stroke="#ffc300"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
            <circle cx="140" cy="8" r="2.5" fill="#ef233c" className="hero-spark" />
          </svg>
        </div>

        <FireworkBurst
          tone="red"
          className="hero-bob pointer-events-none h-10 w-10 shrink-0 sm:h-14 sm:w-14 md:h-[4.25rem] md:w-[4.25rem]"
        />
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
        {[
          ["8%", "10%", "0s", "bg-yellow"],
          ["92%", "16%", "0.4s", "bg-orange"],
          ["18%", "78%", "0.8s", "bg-primary-bright"],
          ["84%", "72%", "1.1s", "bg-gold"],
          ["50%", "-8%", "0.2s", "bg-yellow"],
        ].map(([left, top, delay, color], i) => (
          <span
            key={i}
            className={`hero-spark absolute rounded-full ${night ? "h-2 w-2" : "h-1.5 w-1.5"} ${color}`}
            style={{ left, top, animationDelay: delay }}
          />
        ))}
      </div>
    </div>
  );
}
