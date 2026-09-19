/** First URL segment values that belong to the Next.js app, not a Hostinger mount. */
export const APP_ROOT_SEGMENTS = new Set([
  "_next",
  "api",
  "admin",
  "crackers",
  "1000-wala",
  "products",
  "shop",
  "lottie",
  "videos",
  "images",
  "fonts",
  "logo.png",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "srk-contact.html",
  "__debug",
  "debug",
]);

export function stripTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function basePathFromPathname(pathname: string): string {
  const first =
    String(pathname || "/")
      .split("?")[0]
      .split("/")
      .filter(Boolean)[0] || "";
  if (first && !APP_ROOT_SEGMENTS.has(first)) return `/${first}`;
  return "";
}

export function withBasePath(path: string, base: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || !base) return path;
  if (path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

/** Build-time Hostinger mount, e.g. `/abc`. Empty for local `next dev`. */
export function appBasePath(): string {
  const raw = String(process.env.NEXT_PUBLIC_BASE_PATH || "").trim().replace(/\/+$/, "");
  if (!raw || raw === "/") return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function withAppBase(path: string): string {
  return withBasePath(path, appBasePath());
}

/** Production shop URL from GitHub YAML (`NEXT_PUBLIC_SITE_URL`). */
export function configuredSiteUrl(): string {
  return stripTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || "");
}
