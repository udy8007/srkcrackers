"use client";

import { useEffect } from "react";
import { APP_ROOT_SEGMENTS, appBasePath, withBasePath } from "@/lib/app-base-path";

function detectBase(): string {
  const first = window.location.pathname.split("/").filter(Boolean)[0] || "";
  if (first && !APP_ROOT_SEGMENTS.has(first)) return `/${first}`;
  return "";
}

function sameOriginPath(value: string): string | null {
  if (!value || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:")) {
    return null;
  }
  if (value.startsWith("//")) return null;
  if (value.startsWith("/")) return value;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Prefixes API, assets, and in-app links with the Hostinger Application URL path. */
export function AppBase() {
  useEffect(() => {
    const envBase = appBasePath();
    const base = envBase || detectBase();
    if (!base) return;

    const origFetch = window.fetch.bind(window);
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === "string") {
        const path = sameOriginPath(input);
        if (path) input = withBasePath(path, base);
      } else if (input instanceof URL && input.origin === window.location.origin) {
        input = new URL(withBasePath(`${input.pathname}${input.search}`, base), input.origin);
      }
      return origFetch(input as RequestInfo, init);
    };

    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    const redirectIfUnprefixed = (url: string) => {
      const path = sameOriginPath(url);
      if (!path) return false;
      const next = withBasePath(path, base);
      if (next === path) return false;
      window.location.assign(next);
      return true;
    };
    history.pushState = (data, unused, url) => {
      if (typeof url === "string" && redirectIfUnprefixed(url)) return;
      return origPush(data, unused, url);
    };
    history.replaceState = (data, unused, url) => {
      if (typeof url === "string" && redirectIfUnprefixed(url)) return;
      return origReplace(data, unused, url);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      const path = href ? sameOriginPath(href) : null;
      if (!path) return;
      const next = withBasePath(path, base);
      if (next === path && (path === base || path.startsWith(`${base}/`))) return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(next);
    };
    document.addEventListener("click", onClick, true);

    const prefixMedia = () => {
      document.querySelectorAll("img[src], source[src], script[src], link[href], video[src], audio[src]").forEach((node) => {
        const el = node as HTMLElement & { src?: string; href?: string };
        const attr = el.tagName === "LINK" ? "href" : "src";
        const value = el.getAttribute(attr);
        const path = value ? sameOriginPath(value) : null;
        if (!path) return;
        const next = withBasePath(path, base);
        if (next !== value) el.setAttribute(attr, next);
      });
    };
    prefixMedia();
    const observer = new MutationObserver(prefixMedia);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "href"] });

    return () => {
      window.fetch = origFetch;
      history.pushState = origPush;
      history.replaceState = origReplace;
      document.removeEventListener("click", onClick, true);
      observer.disconnect();
    };
  }, []);

  return null;
}
