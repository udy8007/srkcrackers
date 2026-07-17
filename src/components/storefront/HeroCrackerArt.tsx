"use client";

import { useEffect, useId, useState } from "react";
import Lottie from "lottie-react";

type LottieData = Record<string, unknown>;

function useOptionalLottie(src: string) {
  const [data, setData] = useState<LottieData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(src)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled && json && typeof json === "object") setData(json as LottieData);
      })
      .catch(() => {
        /* SVG fallback */
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  return data;
}

export function HeroCylinderCrackers({ className = "" }: { className?: string }) {
  const data = useOptionalLottie("/lottie/cylinder-group-crackers.json");
  if (data) {
    return <Lottie animationData={data} loop autoplay className={className} aria-hidden />;
  }
  return <CylinderGroupSvg className={className} />;
}

export function HeroConeCracker({ className = "" }: { className?: string }) {
  const data = useOptionalLottie("/lottie/cone-cracker.json");
  if (data) {
    return <Lottie animationData={data} loop autoplay className={className} aria-hidden />;
  }
  return <ConeCrackerSvg className={className} />;
}

function FuseFlame({
  id,
  cx,
  cy,
  delay = "0s",
}: {
  id: string;
  cx: number;
  cy: number;
  delay?: string;
}) {
  return (
    <g style={{ animationDelay: delay }}>
      <circle
        className="hero-glow"
        cx={cx}
        cy={cy}
        r="16"
        fill={`url(#${id}-ember)`}
        style={{ animationDelay: delay }}
      />
      <g className="hero-flame" style={{ transformOrigin: `${cx}px ${cy + 4}px`, animationDelay: delay }}>
        <ellipse cx={cx} cy={cy} rx="5.5" ry="9" fill={`url(#${id}-flame)`} />
        <ellipse cx={cx} cy={cy + 1} rx="2.8" ry="5" fill="#fff6c8" opacity="0.95" />
      </g>
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          className="hero-rise"
          cx={cx + (i - 1) * 5}
          cy={cy - 4}
          r={1.6 + (i % 2) * 0.6}
          fill={i === 1 ? "#fff3a0" : "#ffb703"}
          style={{ animationDelay: `${0.2 * i + parseFloat(delay) || 0}s` }}
        />
      ))}
    </g>
  );
}

/** Soft ambient stage under crackers */
function Stage({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx={rx} ry="11" fill="#c98b4a" opacity="0.18" />
      <ellipse cx={cx} cy={cy - 2} rx={rx * 0.92} ry="8" fill="#ffe0b0" opacity="0.55" />
    </>
  );
}

function SharedDefs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-ember`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff8dc" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#ffc300" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#f77f00" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-flame`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#ef233c" />
        <stop offset="45%" stopColor="#f77f00" />
        <stop offset="100%" stopColor="#ffe566" />
      </linearGradient>
      <linearGradient id={`${id}-foil`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff4c0" />
        <stop offset="40%" stopColor="#ffc300" />
        <stop offset="100%" stopColor="#c98500" />
      </linearGradient>
      <linearGradient id={`${id}-shadow`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
      </linearGradient>
      <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#7a2e0b" floodOpacity="0.28" />
      </filter>
    </defs>
  );
}

type Tube = {
  x: number;
  w: number;
  h: number;
  delay: string;
  skin: "red" | "gold" | "green" | "navy";
  z: number;
};

/** Realistic Sivakasi-style cylinder crackers with lit fuses. */
function CylinderGroupSvg({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const tubes: Tube[] = [
    { x: 28, w: 30, h: 108, delay: "0.1s", skin: "navy", z: 1 },
    { x: 58, w: 34, h: 128, delay: "0s", skin: "red", z: 3 },
    { x: 96, w: 38, h: 148, delay: "0.35s", skin: "gold", z: 4 },
    { x: 136, w: 34, h: 124, delay: "0.2s", skin: "red", z: 3 },
    { x: 168, w: 30, h: 106, delay: "0.45s", skin: "green", z: 1 },
  ];

  const skins = {
    red: { body: [`${uid}-redL`, `${uid}-redR`], band: "#ffd60a" },
    gold: { body: [`${uid}-goldL`, `${uid}-goldR`], band: "#9d0208" },
    green: { body: [`${uid}-greenL`, `${uid}-greenR`], band: "#ffd60a" },
    navy: { body: [`${uid}-navyL`, `${uid}-navyR`], band: "#ffc300" },
  } as const;

  return (
    <svg viewBox="0 0 230 270" className={className} aria-hidden focusable="false">
      <SharedDefs id={uid} />
      <defs>
        <linearGradient id={`${uid}-redL`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5c0a0a" />
          <stop offset="22%" stopColor="#d62828" />
          <stop offset="55%" stopColor="#ff4d4d" />
          <stop offset="100%" stopColor="#7a1010" />
        </linearGradient>
        <linearGradient id={`${uid}-redR`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7a1010" />
          <stop offset="40%" stopColor="#ef233c" />
          <stop offset="100%" stopColor="#4a0808" />
        </linearGradient>
        <linearGradient id={`${uid}-goldL`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a86b00" />
          <stop offset="25%" stopColor="#ffc300" />
          <stop offset="55%" stopColor="#ffe566" />
          <stop offset="100%" stopColor="#c98500" />
        </linearGradient>
        <linearGradient id={`${uid}-goldR`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c98500" />
          <stop offset="50%" stopColor="#ffb703" />
          <stop offset="100%" stopColor="#7a4a00" />
        </linearGradient>
        <linearGradient id={`${uid}-greenL`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0f4d1c" />
          <stop offset="30%" stopColor="#2da815" />
          <stop offset="60%" stopColor="#5ad63a" />
          <stop offset="100%" stopColor="#1a6b28" />
        </linearGradient>
        <linearGradient id={`${uid}-greenR`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a6b28" />
          <stop offset="50%" stopColor="#2da815" />
          <stop offset="100%" stopColor="#0a3012" />
        </linearGradient>
        <linearGradient id={`${uid}-navyL`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0d1b2a" />
          <stop offset="30%" stopColor="#1b3a5a" />
          <stop offset="60%" stopColor="#3d6a9a" />
          <stop offset="100%" stopColor="#152a40" />
        </linearGradient>
        <linearGradient id={`${uid}-navyR`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#152a40" />
          <stop offset="50%" stopColor="#245078" />
          <stop offset="100%" stopColor="#081018" />
        </linearGradient>
      </defs>

      <Stage cx={115} cy={248} rx={92} />

      {[...tubes]
        .sort((a, b) => a.z - b.z)
        .map((t) => {
          const top = 220 - t.h;
          const mid = t.x + t.w / 2;
          const skin = skins[t.skin];
          const rx = t.w / 2;
          return (
            <g key={`${t.x}-${t.skin}`} filter={`url(#${uid}-soft)`} className="hero-bob" style={{ animationDelay: t.delay }}>
              {/* contact shadow */}
              <ellipse cx={mid} cy={222} rx={rx + 2} ry="5" fill="#000" opacity="0.16" />

              {/* tube body with 3D cylinder sides */}
              <path
                d={`M${t.x} ${top + 6}
                   L${t.x} ${220 - 4}
                   Q${mid} ${228} ${t.x + t.w} ${220 - 4}
                   L${t.x + t.w} ${top + 6}
                   Q${mid} ${top - 2} ${t.x} ${top + 6} Z`}
                fill={`url(#${skin.body[0]})`}
              />
              {/* right shade half for roundness */}
              <path
                d={`M${mid} ${top + 2}
                   L${mid} ${220}
                   Q${mid + rx * 0.35} ${224} ${t.x + t.w} ${216}
                   L${t.x + t.w} ${top + 8}
                   Q${mid + rx * 0.2} ${top} ${mid} ${top + 2} Z`}
                fill={`url(#${skin.body[1]})`}
                opacity="0.55"
              />
              {/* gloss streak */}
              <path
                d={`M${t.x + t.w * 0.22} ${top + 16}
                   L${t.x + t.w * 0.22} ${210}
                   Q${t.x + t.w * 0.3} ${214} ${t.x + t.w * 0.36} ${208}
                   L${t.x + t.w * 0.36} ${top + 18} Z`}
                fill="#fff"
                opacity="0.22"
              />

              {/* foil bands */}
              <rect
                x={t.x - 1}
                y={top + t.h * 0.28}
                width={t.w + 2}
                height="9"
                rx="1.5"
                fill={`url(#${uid}-foil)`}
              />
              <rect
                x={t.x - 1}
                y={top + t.h * 0.28 + 2}
                width={t.w + 2}
                height="2"
                fill="#fff"
                opacity="0.35"
              />
              <rect x={t.x} y={top + t.h * 0.52} width={t.w} height="5" rx="1" fill={skin.band} opacity="0.9" />

              {/* top cap (ellipse = cylinder end) */}
              <ellipse cx={mid} cy={top + 5} rx={rx} ry="6" fill="#1a1210" />
              <ellipse cx={mid} cy={top + 4} rx={rx * 0.72} ry="3.8" fill="#3a2a24" />
              <ellipse cx={mid} cy={top + 3.2} rx={rx * 0.35} ry="1.8" fill="#5a4035" />

              {/* twisted fuse */}
              <path
                d={`M${mid} ${top + 2}
                   C${mid + 7} ${top - 10}, ${mid - 5} ${top - 18}, ${mid + 2} ${top - 28}`}
                fill="none"
                stroke="#5c4a3a"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d={`M${mid} ${top + 2}
                   C${mid + 7} ${top - 10}, ${mid - 5} ${top - 18}, ${mid + 2} ${top - 28}`}
                fill="none"
                stroke="#c4a484"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeDasharray="2 3"
                opacity="0.7"
              />

              <FuseFlame id={uid} cx={mid + 2} cy={top - 32} delay={t.delay} />
            </g>
          );
        })}
    </svg>
  );
}

/** Realistic flower-pot / cone (anar) with fountain sparks. */
function ConeCrackerSvg({ className = "" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg viewBox="0 0 230 270" className={className} aria-hidden focusable="false">
      <SharedDefs id={uid} />
      <defs>
        <linearGradient id={`${uid}-pot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe566" />
          <stop offset="35%" stopColor="#f77f00" />
          <stop offset="70%" stopColor="#d62828" />
          <stop offset="100%" stopColor="#7a0c0c" />
        </linearGradient>
        <linearGradient id={`${uid}-potShine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${uid}-rim`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff6d0" />
          <stop offset="100%" stopColor="#d4a017" />
        </linearGradient>
        <radialGradient id={`${uid}-plume`} cx="50%" cy="80%" r="70%">
          <stop offset="0%" stopColor="#fff8dc" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#ffc300" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ef233c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <Stage cx={115} cy={248} rx={78} />

      <g filter={`url(#${uid}-soft)`} className="hero-bob">
        {/* soft under-glow */}
        <ellipse className="hero-glow" cx="115" cy="78" rx="48" ry="36" fill={`url(#${uid}-plume)`} />

        {/* clay saucer */}
        <ellipse cx="115" cy="226" rx="58" ry="11" fill="#8a5a28" opacity="0.35" />
        <ellipse cx="115" cy="224" rx="58" ry="11" fill="#c9853a" />
        <ellipse cx="115" cy="222" rx="52" ry="8" fill="#e8b86d" />
        <path d="M60 222 Q115 236 170 222 L162 214 Q115 226 68 214 Z" fill="#a86b28" opacity="0.55" />

        {/* cone / pot body */}
        <path
          d="M115 58
             C128 58 148 120 168 210
             Q115 228 62 210
             C82 120 102 58 115 58 Z"
          fill={`url(#${uid}-pot)`}
        />
        <path
          d="M115 58
             C122 58 138 120 152 205
             Q115 218 115 210
             L115 58 Z"
          fill={`url(#${uid}-potShine)`}
        />

        {/* wrapped paper rings */}
        <path d="M78 168 Q115 182 152 168" fill="none" stroke="#7a0c0c" strokeWidth="4" opacity="0.55" />
        <path d="M78 168 Q115 176 152 168" fill="none" stroke="#ffd60a" strokeWidth="1.6" opacity="0.7" />
        <path d="M88 128 Q115 140 142 128" fill="none" stroke="#fff" strokeWidth="3" opacity="0.35" />
        <path d="M96 96 Q115 106 134 96" fill="none" stroke="#7a0c0c" strokeWidth="2.5" opacity="0.45" />

        {/* gold foil collar */}
        <path
          d="M92 74 Q115 86 138 74 L134 68 Q115 78 96 68 Z"
          fill={`url(#${uid}-rim)`}
        />
        <ellipse cx="115" cy="64" rx="18" ry="6" fill="#2b1a10" />
        <ellipse cx="115" cy="62" rx="11" ry="3.5" fill="#4a3224" />

        {/* fuse */}
        <path
          d="M115 60 C120 48 108 40 116 28"
          fill="none"
          stroke="#5c4a3a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <FuseFlame id={uid} cx={116} cy={24} delay="0s" />
      </g>

      {/* fountain spark shower */}
      {[
        [115, 50, "0s", 2.2],
        [100, 56, "0.25s", 1.8],
        [130, 54, "0.4s", 1.9],
        [90, 68, "0.55s", 1.5],
        [140, 66, "0.7s", 1.6],
        [108, 42, "0.15s", 2],
        [122, 40, "0.85s", 1.7],
        [96, 48, "1.05s", 1.4],
        [134, 46, "1.2s", 1.5],
      ].map(([x, y, delay, r], i) => (
        <circle
          key={i}
          className="hero-rise"
          cx={x}
          cy={y}
          r={r}
          fill={i % 3 === 0 ? "#fff3a0" : i % 3 === 1 ? "#ffc300" : "#ef233c"}
          style={{ animationDelay: String(delay) }}
        />
      ))}
    </svg>
  );
}
