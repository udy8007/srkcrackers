"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Cracker page loader assets for the admin dashboard.
 * Renders a sparkler/fountain cracker with fireworks.
 */

const FOUNTAIN: { tx: number; ty: number; delay: string; color: string }[] = [
  { tx: -40, ty: -86, delay: "0s", color: "cl-spark--gold" },
  { tx: -70, ty: -78, delay: "0.09s", color: "cl-spark--pink" },
  { tx: -92, ty: -54, delay: "0.18s", color: "cl-spark--red" },
  { tx: -38, ty: -64, delay: "0.27s", color: "cl-spark--pink" },
  { tx: 0, ty: -108, delay: "0.36s", color: "cl-spark--gold" },
  { tx: -66, ty: -34, delay: "0.45s", color: "cl-spark--red" },
  { tx: 42, ty: -88, delay: "0.54s", color: "cl-spark--gold" },
  { tx: 70, ty: -78, delay: "0.63s", color: "cl-spark--red" },
  { tx: 94, ty: -52, delay: "0.72s", color: "cl-spark--pink" },
  { tx: 38, ty: -64, delay: "0.81s", color: "cl-spark--gold" },
  { tx: 66, ty: -34, delay: "0.9s", color: "cl-spark--red" },
  { tx: 0, ty: -128, delay: "0.99s", color: "cl-spark--pink" },
];

/** Full-bleed fireworks layer (flying rockets, blooms, embers, sparks). */
export function CrackerSky() {
  return (
    <div className="cl-sky" aria-hidden="true">
      <span className="celeb-rocket celeb-rocket--1">
        <i />
        <b />
      </span>
      <span className="celeb-rocket celeb-rocket--2">
        <i />
        <b />
      </span>
      <span className="celeb-rocket celeb-rocket--3">
        <i />
        <b />
      </span>
      <span className="celeb-bloom celeb-bloom--1" />
      <span className="celeb-bloom celeb-bloom--2" />
      <span className="celeb-bloom celeb-bloom--3" />
      <span className="celeb-ember" />
      <span className="celeb-ember" />
      <span className="celeb-ember" />
      <span className="celeb-ember" />
      <span className="celeb-ember" />
      <span className="celeb-ember" />
      <span className="celeb-ember" />
      <span className="celeb-ember" />
      <div className="hero-top-sparks">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

/** Sparkling cracker cone with an animated fountain of sparks. */
export function CrackerFountain({ className }: { className?: string }) {
  return (
    <div className={cn("cl-stage", className)}>
      <div className="cl-fountain" aria-hidden="true">
        {FOUNTAIN.map((spark, i) => (
          <i
            key={i}
            className={cn("cl-spark", spark.color)}
            style={
              {
                "--tx": `${spark.tx}px`,
                "--ty": `${spark.ty}px`,
                animationDelay: spark.delay,
              } as CSSProperties
            }
          />
        ))}
        <span className="cl-ring" />
        <span className="cl-ring" style={{ animationDelay: "0.45s" }} />
        <span className="cl-tip" />
      </div>
      <svg
        className="cl-cracker"
        viewBox="0 0 128 176"
        role="img"
        aria-label="Sparkling cracker"
      >
        <defs>
          <linearGradient id="clCone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ef233c" />
            <stop offset="0.55" stopColor="#c2121e" />
            <stop offset="1" stopColor="#7f0710" />
          </linearGradient>
          <linearGradient id="clConeShine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="0.4" stopColor="rgba(255,255,255,0)" />
            <stop offset="1" stopColor="rgba(15,0,4,0.35)" />
          </linearGradient>
          <linearGradient id="clBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffd54f" />
            <stop offset="0.45" stopColor="#ffc300" />
            <stop offset="1" stopColor="#f77f00" />
          </linearGradient>
        </defs>
        <path
          d="M64 6 Q 60 60 26 152 Q 23 162 30 166 L 98 166 Q 105 162 102 152 Q 68 60 64 6 Z"
          fill="url(#clCone)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.5"
        />
        <path
          d="M64 6 Q 60 60 26 152 Q 23 162 30 166 L 98 166 Q 105 162 102 152 Q 68 60 64 6 Z"
          fill="url(#clConeShine)"
        />
        <path d="M64 6 L 70 14" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="72" cy="16" rx="3.5" ry="3.5" fill="#fde047" opacity="0.85" />
        <path d="M38 122 Q 64 126 90 122 L 90 132 Q 64 136 38 132 Z" fill="url(#clBand)" />
        <path d="M52 78 Q 64 80 76 78 L 76 82 Q 64 84 52 82 Z" fill="url(#clBand)" opacity="0.85" />
        <ellipse cx="64" cy="166" rx="40" ry="7" fill="rgba(0,0,0,0.3)" />
      </svg>
    </div>
  );
}

/** The cracker graphic + brand caption. Rendered on its own or inside the overlay. */
export function CrackerArt({
  label = "Loading...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("cl-art", className)} role="status" aria-live="polite">
      <CrackerFountain />
      <div className="cl-copy">
        <div className="cl-brand">
          <span className="cl-brand-core">SRK</span>
          <span className="cl-brand-text">Crackers</span>
        </div>
        <div className="cl-sub">
          {label}
          <span className="cl-dots">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Full-width panel used while an admin route or API is still loading. */
export function AdminRouteLoader({
  label = "Loading...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("cl-panel min-h-[min(70vh,640px)] w-full", className)}>
      <CrackerSky />
      <CrackerArt label={label} />
    </div>
  );
}