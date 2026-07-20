"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SHINCHAN_FRAMES = [
  "/images/shinchan-cut-1.png",
  "/images/shinchan-cut-2.png",
  "/images/shinchan-cut-3.png",
  "/images/shinchan-cut-4.png",
];

type CastSide = "left" | "right";

/** One animated cast for the same-line hero row. */
export function HeroCastSide({ side }: { side: CastSide }) {
  const [frame, setFrame] = useState(side === "left" ? 0 : 2);

  useEffect(() => {
    SHINCHAN_FRAMES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
    const id = window.setInterval(() => {
      setFrame((n) => (n + 1) % SHINCHAN_FRAMES.length);
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={`hero-inline-cast hero-inline-cast--${side}`} aria-hidden="true">
      <div className="hero-inline-cast__burst" />
      <div className="hero-inline-cast__img">
        <Image
          src={SHINCHAN_FRAMES[frame]}
          alt=""
          width={260}
          height={300}
          priority={side === "left"}
          unoptimized
          draggable={false}
        />
      </div>
      <div className="celeb-spark-spray celeb-spark-spray--wing">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

/** Ambient spark dots for the banner background. */
export function HeroCelebSparks() {
  return (
    <div className="hero-wing-sparks" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
