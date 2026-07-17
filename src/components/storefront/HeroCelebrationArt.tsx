import type { CSSProperties } from "react";

type Props = { className?: string; style?: CSSProperties };

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <radialGradient id={`${id}-spark`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fffef2" stopOpacity="1" />
        <stop offset="35%" stopColor="#ffe17a" stopOpacity="0.95" />
        <stop offset="70%" stopColor="#ffc300" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#ffc300" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-bokeh`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffd60a" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#ffd60a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffe0b5" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#ffc98a" stopOpacity="0.2" />
      </linearGradient>
    </defs>
  );
}

/** Tiny festive backdrop shared by both characters. */
function Backdrop({ id }: { id: string }) {
  return (
    <g aria-hidden>
      <ellipse cx="100" cy="304" rx="82" ry="16" fill={`url(#${id}-ground)`} />
      {/* string lights */}
      <path
        d="M8 24 C 50 40, 150 40, 192 24"
        fill="none"
        stroke="#c4a484"
        strokeWidth="1.6"
        strokeDasharray="4 6"
        opacity="0.7"
      />
      {[
        [34, 33, "#f77f00"],
        [72, 38, "#ffc300"],
        [128, 38, "#f77f00"],
        [166, 33, "#ffd60a"],
      ].map(([x, y, c], i) => (
        <g key={i}>
          <line x1={x} y1={Number(y) - 8} x2={x} y2={y} stroke="#c4a484" strokeWidth="1.2" />
          <circle
            cx={x}
            cy={Number(y) + 3}
            r="4"
            fill={String(c)}
            className="hero-spark"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
        </g>
      ))}
      {/* bokeh + glints */}
      <circle cx="30" cy="120" r="10" fill={`url(#${id}-bokeh)`} />
      <circle cx="176" cy="150" r="12" fill={`url(#${id}-bokeh)`} opacity="0.7" />
      <circle cx="150" cy="96" r="7" fill={`url(#${id}-bokeh)`} opacity="0.6" />
      <path
        d="M40 170 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z"
        fill="#ffc300"
        className="hero-spark"
        style={{ animationDelay: "0.5s" }}
      />
      <path
        d="M168 200 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z"
        fill="#f77f00"
        className="hero-spark"
        style={{ animationDelay: "0.9s" }}
      />
    </g>
  );
}

/** Sparkler in a raised hand — waves + glows. Origin is the shoulder point. */
function SparklerArm({
  id,
  shoulder,
  wrist,
  tip,
  skin,
  originX,
  originY,
  delay = "0s",
}: {
  id: string;
  shoulder: [number, number];
  wrist: [number, number];
  tip: [number, number];
  skin: string;
  originX: number;
  originY: number;
  delay?: string;
}) {
  const [sx, sy] = shoulder;
  const [wx, wy] = wrist;
  const [tx, ty] = tip;
  return (
    <g className="hero-wave" style={{ transformOrigin: `${originX}px ${originY}px` }}>
      <path
        d={`M${sx} ${sy} Q${(sx + wx) / 2 + 6} ${(sy + wy) / 2} ${wx} ${wy}`}
        fill="none"
        stroke={skin}
        strokeWidth="9"
        strokeLinecap="round"
      />
      <line x1={wx} y1={wy} x2={tx} y2={ty} stroke="#8a7a6a" strokeWidth="2.4" strokeLinecap="round" />
      <g className="hero-spark" style={{ transformOrigin: `${tx}px ${ty}px`, animationDelay: delay }}>
        <circle cx={tx} cy={ty} r="18" fill={`url(#${id}-spark)`} />
        <circle cx={tx} cy={ty} r="5" fill="#fffdf4" />
        {[0, 60, 120, 180, 240, 300].map((a) => {
          const r = 15;
          const rad = (a * Math.PI) / 180;
          return (
            <line
              key={a}
              x1={tx}
              y1={ty}
              x2={tx + r * Math.cos(rad)}
              y2={ty + r * Math.sin(rad)}
              stroke="#ffe17a"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.8"
            />
          );
        })}
      </g>
    </g>
  );
}

/** A cheerful boy holding a sparkler (faces toward center). */
export function HeroBoy({ className = "", style }: Props) {
  const id = "hero-boy";
  return (
    <svg viewBox="0 0 200 320" className={className} style={style} aria-hidden focusable="false">
      <Defs id={id} />
      <Backdrop id={id} />
      <g>
        {/* far arm (resting) */}
        <path d="M64 150 Q52 182 58 214" fill="none" stroke="#f2c9a8" strokeWidth="9" strokeLinecap="round" />
        {/* legs */}
        <path d="M72 214 L72 288 Q80 296 88 288 L88 214 Z" fill="#1d3557" />
        <path d="M92 214 L92 288 Q100 296 108 288 L108 214 Z" fill="#22436b" />
        <ellipse cx="80" cy="292" rx="12" ry="6" fill="#12233b" />
        <ellipse cx="100" cy="292" rx="12" ry="6" fill="#12233b" />
        {/* torso / shirt */}
        <path d="M60 150 Q90 138 118 150 L112 216 Q88 226 66 216 Z" fill="#4cc9f0" />
        <path d="M60 150 Q90 138 118 150 L116 166 Q88 156 62 166 Z" fill="#38b6e0" />
        <circle cx="89" cy="182" r="3" fill="#ffffff" opacity="0.8" />
        <circle cx="89" cy="196" r="3" fill="#ffffff" opacity="0.8" />
        {/* neck + head */}
        <rect x="82" y="120" width="14" height="14" rx="6" fill="#f2c9a8" />
        <circle cx="88" cy="96" r="27" fill="#f7d6b8" />
        {/* hair */}
        <path d="M62 92 Q64 62 90 62 Q116 62 114 92 Q104 78 88 80 Q72 82 62 92 Z" fill="#2b1f1f" />
        <circle cx="79" cy="96" r="2.1" fill="#2b1f1f" />
        <circle cx="97" cy="96" r="2.1" fill="#2b1f1f" />
        <path d="M80 106 Q88 112 96 106" fill="none" stroke="#c1121f" strokeWidth="2" strokeLinecap="round" />
        <circle cx="74" cy="104" r="3.4" fill="#ff9d9d" opacity="0.6" />
        <circle cx="102" cy="104" r="3.4" fill="#ff9d9d" opacity="0.6" />
        {/* raised arm + sparkler */}
        <SparklerArm
          id={id}
          shoulder={[116, 150]}
          wrist={[150, 96]}
          tip={[166, 44]}
          skin="#f7d6b8"
          originX={116}
          originY={150}
        />
      </g>
    </svg>
  );
}

/** A cheerful girl holding a sparkler (faces toward center). */
export function HeroGirl({ className = "", style }: Props) {
  const id = "hero-girl";
  return (
    <svg viewBox="0 0 200 320" className={className} style={style} aria-hidden focusable="false">
      <Defs id={id} />
      <Backdrop id={id} />
      <g>
        {/* far arm (resting) */}
        <path d="M64 156 Q52 186 58 214" fill="none" stroke="#f2c9a8" strokeWidth="8.5" strokeLinecap="round" />
        {/* legs */}
        <path d="M84 250 L82 292 Q88 299 94 292 L94 250 Z" fill="#f2c9a8" />
        <path d="M106 250 L106 292 Q112 299 118 292 L116 250 Z" fill="#f2c9a8" />
        <ellipse cx="88" cy="296" rx="10" ry="5" fill="#c1121f" />
        <ellipse cx="112" cy="296" rx="10" ry="5" fill="#c1121f" />
        {/* dress (flared) */}
        <path d="M62 150 Q92 138 120 150 L138 250 Q92 266 46 250 Z" fill="#e5478a" />
        <path d="M62 150 Q92 138 120 150 L124 172 Q92 160 60 172 Z" fill="#c93375" />
        <path d="M46 250 Q92 266 138 250 L134 246 Q92 260 50 246 Z" fill="#ffd60a" opacity="0.9" />
        <circle cx="92" cy="192" r="3" fill="#ffe17a" />
        <circle cx="92" cy="208" r="3" fill="#ffe17a" />
        {/* neck + head */}
        <rect x="84" y="120" width="14" height="14" rx="6" fill="#f2c9a8" />
        <circle cx="91" cy="96" r="27" fill="#f7d6b8" />
        {/* hair with side bun */}
        <path d="M64 96 Q64 62 91 62 Q120 62 118 98 Q118 118 110 128 L112 96 Q104 78 91 80 Q76 82 70 98 L72 126 Q64 116 64 96 Z" fill="#3a2a2a" />
        <circle cx="122" cy="86" r="12" fill="#3a2a2a" />
        <circle cx="122" cy="86" r="4" fill="#e5478a" />
        {/* face */}
        <circle cx="82" cy="96" r="2.1" fill="#2b1f1f" />
        <circle cx="100" cy="96" r="2.1" fill="#2b1f1f" />
        <path d="M83 106 Q91 112 99 106" fill="none" stroke="#c1121f" strokeWidth="2" strokeLinecap="round" />
        <circle cx="77" cy="104" r="3.4" fill="#ff9d9d" opacity="0.65" />
        <circle cx="105" cy="104" r="3.4" fill="#ff9d9d" opacity="0.65" />
        {/* bindi */}
        <circle cx="91" cy="80" r="1.8" fill="#c1121f" />
        {/* raised arm + sparkler */}
        <SparklerArm
          id={id}
          shoulder={[120, 152]}
          wrist={[152, 98]}
          tip={[168, 46]}
          skin="#f7d6b8"
          originX={120}
          originY={152}
          delay="0.4s"
        />
      </g>
    </svg>
  );
}
