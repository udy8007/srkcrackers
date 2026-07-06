const EMOJIS = ["🎆", "✨", "🎇", "💥", "🪔", "⭐"] as const;

const BURSTS = Array.from({ length: 14 }, (_, i) => ({
  left: `${8 + ((i * 17) % 84)}%`,
  top: `${6 + ((i * 13) % 55)}%`,
  delay: `${(i % 7) * 0.18}s`,
  emoji: EMOJIS[i % EMOJIS.length],
  size: i % 3 === 0 ? "text-xl" : "text-base",
}));

/** Festive cracker / sparkle burst behind order confirmation. */
export function OrderSuccessCelebration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-2xl sm:rounded-2xl" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-yellow/20 via-transparent to-primary/5" />
      {BURSTS.map((burst, i) => (
        <span
          key={i}
          className={`absolute animate-cracker-burst ${burst.size}`}
          style={{
            left: burst.left,
            top: burst.top,
            animationDelay: burst.delay,
          }}
        >
          {burst.emoji}
        </span>
      ))}
      <span className="absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2 rounded-full bg-yellow/30 blur-2xl animate-success-glow" />
    </div>
  );
}
