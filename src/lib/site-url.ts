import { headers } from "next/headers";
import { BUSINESS } from "@/lib/constants";
import {
  basePathFromPathname,
  configuredSiteUrl,
  stripTrailingSlash,
} from "@/lib/app-base-path";

export {
  appBasePath,
  basePathFromPathname,
  configuredSiteUrl,
  stripTrailingSlash,
  withAppBase,
  withBasePath,
  APP_ROOT_SEGMENTS,
} from "@/lib/app-base-path";

function defaultSchemeFor(host: string): string {
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(host) ? "http" : "https";
}

export function publicSiteUrlFromAbsolute(link: string): string {
  try {
    const url = new URL(link);
    return `${url.origin}${basePathFromPathname(url.pathname)}`;
  } catch {
    return stripTrailingSlash(BUSINESS.url);
  }
}

/**
 * Public site URL: https://www.srkcrackers.in in production, or the request host
 * when NEXT_PUBLIC_SITE_URL is not set (local dev).
 */
export async function resolveSiteOrigin(): Promise<string> {
  const configured = configuredSiteUrl();
  if (configured) return configured;

  try {
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host")?.trim() ||
      requestHeaders.get("host")?.trim();
    if (host) {
      const proto =
        (requestHeaders.get("x-forwarded-proto") ?? "").split(",")[0]?.trim() ||
        requestHeaders.get("x-forwarded-scheme")?.trim() ||
        defaultSchemeFor(host);
      const origin = stripTrailingSlash(`${proto}://${host}`);
      const envBase = (process.env.NEXT_PUBLIC_BASE_PATH || "").trim().replace(/\/+$/, "");
      const prefix = (
        requestHeaders.get("x-forwarded-prefix") ||
        requestHeaders.get("x-base-path") ||
        envBase ||
        ""
      )
        .trim()
        .replace(/\/+$/, "");
      if (prefix && prefix !== "/") {
        return `${origin}${prefix.startsWith("/") ? prefix : `/${prefix}`}`;
      }
      const uri =
        requestHeaders.get("x-original-uri") ||
        requestHeaders.get("x-forwarded-uri") ||
        "";
      const fromUri = basePathFromPathname(uri);
      if (fromUri) return `${origin}${fromUri}`;
      return origin;
    }
  } catch {
    // Build / cron without a request.
  }
  return stripTrailingSlash(process.env.NEXTAUTH_URL || process.env.AUTH_URL || BUSINESS.url);
}
