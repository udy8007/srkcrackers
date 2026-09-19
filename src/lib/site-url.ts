import { headers } from "next/headers";
import { BUSINESS } from "@/lib/constants";
import { basePathFromPathname, stripTrailingSlash } from "@/lib/app-base-path";

export { basePathFromPathname, stripTrailingSlash, withBasePath, APP_ROOT_SEGMENTS } from "@/lib/app-base-path";

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
 * Public site URL for the current request: https://host or https://host/abc
 * when Hostinger mounts the Node app under an Application URL path.
 */
export async function resolveSiteOrigin(): Promise<string> {
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
  return stripTrailingSlash(process.env.APP_URL || BUSINESS.url);
}
