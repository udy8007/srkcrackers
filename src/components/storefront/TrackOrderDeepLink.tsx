"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useUI } from "@/store/ui";
import { scrollToId } from "@/lib/client-actions";
import { isValidPhone } from "@/lib/utils";

const TRACK_PHONE_KEY = (orderNumber: string) => `srk-track:${orderNumber}`;

export function readStoredTrackPhone(orderNumber: string): string {
  try {
    const stored = sessionStorage.getItem(TRACK_PHONE_KEY(orderNumber))?.replace(/\D/g, "") ?? "";
    return isValidPhone(stored) ? stored : "";
  } catch {
    return "";
  }
}

export function storeTrackPhone(orderNumber: string, phone: string) {
  try {
    sessionStorage.setItem(TRACK_PHONE_KEY(orderNumber), phone.replace(/\D/g, ""));
  } catch {
    /* ignore */
  }
}

/** Reads ?track=ORDER&phone=MOBILE from the URL and opens the track section. */
export function TrackOrderDeepLink() {
  const searchParams = useSearchParams();
  const setTrackPrefill = useUI((s) => s.setTrackPrefill);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const orderNumber = searchParams.get("track")?.trim().toUpperCase();
    if (!orderNumber) return;
    handled.current = true;

    const fromUrl = searchParams.get("phone")?.replace(/\D/g, "") ?? "";
    const phone = isValidPhone(fromUrl) ? fromUrl : readStoredTrackPhone(orderNumber);

    setTrackPrefill({ orderNumber, phone });
    setTimeout(() => scrollToId("track"), 100);

    const url = new URL(window.location.href);
    url.searchParams.delete("track");
    url.searchParams.delete("phone");
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", next || "/");
  }, [searchParams, setTrackPrefill]);

  return null;
}
