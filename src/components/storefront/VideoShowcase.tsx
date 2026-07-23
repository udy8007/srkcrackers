"use client";

import { useRef, useState } from "react";
import { SectionDecor } from "./FestiveDecor";
import { SectionHead } from "./SectionHead";

const VIDEOS = [
  { src: "/videos/srk-crackers-showcase.mp4", title: "SRK Crackers Collection" },
  { src: "/videos/srk-crackers-showcase-2.mp4", title: "Festive Cracker Highlights" },
  { src: "/videos/srk-crackers-showcase-3.mp4", title: "Premium Fireworks Showcase" },
  { src: "/videos/srk-crackers-showcase-4.mp4", title: "Celebration Collection" },
];

function VideoCard({ src, title }: { src: string; title: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  return (
    <article className="group relative rounded-[1.4rem] bg-gradient-to-br from-yellow via-orange to-primary p-[3px] shadow-[0_18px_55px_rgba(255,195,0,0.2)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(255,195,0,0.35)] sm:rounded-[1.75rem]">
      <div className="relative overflow-hidden rounded-[calc(1.4rem-3px)] bg-black sm:rounded-[calc(1.75rem-3px)]">
        <video
          ref={videoRef}
          className="aspect-video max-h-[75vh] w-full bg-black object-contain"
          controls
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          aria-label={title}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support HTML video.
        </video>

        {!isPlaying && (
          <button
            type="button"
            onClick={togglePlayback}
            aria-label={`Play ${title}`}
            className="group/play absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 transition hover:bg-black/10"
          >
            <span className="absolute h-20 w-20 animate-ping rounded-full bg-yellow/25 sm:h-24 sm:w-24" />
            <span className="relative grid h-16 w-16 place-items-center rounded-full border-2 border-white/80 bg-gradient-to-br from-yellow to-orange text-primary-dark shadow-[0_0_30px_rgba(255,195,0,0.7)] transition duration-300 group-hover/play:scale-110 sm:h-20 sm:w-20">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="ml-1 h-8 w-8 fill-current sm:h-9 sm:w-9"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <h4 className="px-3 py-3 text-center font-display text-sm font-semibold text-white sm:text-base">
        {title}
      </h4>
    </article>
  );
}

export function VideoShowcase() {
  return (
    <section
      id="showcase-video"
      className="relative isolate overflow-hidden bg-gradient-to-b from-[#210307] via-primary-dark to-[#160204] px-4 py-14 sm:py-18"
    >
      <SectionDecor variant="sparklers" />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_15%,#ffc300_0,transparent_22%),radial-gradient(circle_at_85%_80%,#f77f00_0,transparent_24%)]"
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="[&_h3]:text-yellow [&_p]:text-white/75">
          <SectionHead
            title="Experience SRK Crackers"
            subtitle="A closer look at our festive collection — bright, colourful and celebration-ready"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
          {VIDEOS.map((video) => (
            <VideoCard key={video.src} {...video} />
          ))}
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-white/75 sm:text-base">
          Turn up the sound and discover the colours of celebration. Tap play or use fullscreen for
          the best viewing experience.
        </p>
      </div>
    </section>
  );
}
