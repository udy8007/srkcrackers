"use client";

import { useEffect, useRef, useState } from "react";
import { BUSINESS } from "@/lib/constants";

const GAP = 12;

function resetAgentPosition(el: HTMLElement) {
  el.style.setProperty("position", "relative", "important");
  el.style.setProperty("inset", "auto", "important");
  el.style.setProperty("bottom", "auto", "important");
  el.style.setProperty("right", "auto", "important");
  el.style.setProperty("top", "auto", "important");
  el.style.setProperty("left", "auto", "important");
  el.style.setProperty("margin", "0", "important");
}

function mountAgentInSlot(slot: HTMLElement) {
  const agent = document.querySelector('[id^="JotformAgent-"]') as HTMLElement | null;
  if (!agent || agent.parentElement === slot) {
    if (agent && agent.parentElement === slot) resetAgentPosition(agent);
    return;
  }

  slot.appendChild(agent);
  resetAgentPosition(agent);

  // Only reset the launcher wrapper — leave open chat panel fixed if present
  agent.querySelectorAll("*").forEach((node) => {
    const el = node as HTMLElement;
    const style = getComputedStyle(el);
    if (style.position !== "fixed") return;
    const rect = el.getBoundingClientRect();
    // Launcher button is small (~56–72px); skip full-screen chat panels
    if (rect.width > 200 || rect.height > 200) return;
    resetAgentPosition(el);
  });
}

/** WhatsApp + Noupe chatbot in one aligned stack above the sticky bar. */
export function FloatingDock() {
  const chatSlotRef = useRef<HTMLDivElement>(null);
  const [barHeight, setBarHeight] = useState(120);

  useEffect(() => {
    const bar = document.querySelector(".sticky-order-bar");
    if (!bar) return;

    const sync = () => {
      const h = Math.ceil(bar.getBoundingClientRect().height);
      setBarHeight(h);
      document.documentElement.style.setProperty("--sticky-bar-offset", `${h}px`);
      if (chatSlotRef.current) mountAgentInSlot(chatSlotRef.current);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(bar);
    window.addEventListener("resize", sync);

    const mo = new MutationObserver(sync);
    mo.observe(document.body, { childList: true, subtree: true });

    const poll = window.setInterval(sync, 600);
    const stopPoll = window.setTimeout(() => clearInterval(poll), 15000);

    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", sync);
      clearInterval(poll);
      clearTimeout(stopPoll);
    };
  }, []);

  const text = encodeURIComponent("Hi SRK Crackers, I want to place an order.");

  return (
    <div
      className="fixed right-4 z-[55] flex flex-col items-center gap-3"
      style={{ bottom: barHeight + GAP }}
      aria-label="Contact shortcuts"
    >
      <a
        href={`https://wa.me/${BUSINESS.whatsapp}?text=${text}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="pulse-whatsapp flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:scale-105"
      >
        <svg viewBox="0 0 32 32" className="h-8 w-8" fill="currentColor" aria-hidden focusable="false">
          <path d="M16.004 2.667c-7.36 0-13.333 5.973-13.333 13.333 0 2.353.616 4.649 1.787 6.677L2.667 29.333l6.83-1.79a13.28 13.28 0 0 0 6.507 1.657h.005c7.36 0 13.333-5.973 13.333-13.333S23.365 2.667 16.004 2.667zm0 24.213h-.004a11.03 11.03 0 0 1-5.62-1.539l-.403-.239-4.053 1.063 1.082-3.95-.263-.405a11.01 11.01 0 0 1-1.688-5.884c0-6.115 4.977-11.09 11.096-11.09 2.963 0 5.748 1.155 7.842 3.251a11.02 11.02 0 0 1 3.247 7.847c0 6.116-4.977 11.09-11.083 11.09zm6.083-8.307c-.333-.167-1.973-.973-2.279-1.084-.305-.111-.528-.167-.75.167-.223.333-.861 1.083-1.056 1.306-.195.222-.389.25-.722.083-.333-.167-1.408-.519-2.681-1.653-.991-.883-1.66-1.974-1.855-2.307-.194-.334-.02-.514.146-.68.15-.149.334-.389.5-.583.167-.195.222-.334.334-.556.111-.223.055-.417-.028-.584-.083-.167-.75-1.806-1.028-2.473-.271-.649-.546-.561-.75-.572l-.639-.011c-.222 0-.583.083-.889.417-.305.333-1.166 1.139-1.166 2.778 0 1.639 1.194 3.223 1.361 3.445.167.222 2.35 3.589 5.695 5.031.796.344 1.417.55 1.901.704.799.254 1.526.218 2.101.132.641-.096 1.973-.807 2.251-1.586.278-.779.278-1.446.195-1.586-.083-.139-.305-.222-.639-.389z" />
        </svg>
      </a>
      <div ref={chatSlotRef} className="shrink-0 leading-none [&_[id^=JotformAgent-]]:relative" />
    </div>
  );
}
