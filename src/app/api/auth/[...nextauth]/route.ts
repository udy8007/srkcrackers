import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { appBasePath } from "@/lib/app-base-path";

/**
 * Next.js strips `basePath` from the App Router request URL. Auth.js then
 * fails to parse `/api/auth/session` against that prefixed path and returns 400.
 * Put the mount back on the URL before Auth.js sees it. No-op at domain root.
 */
function withAuthBasePath(req: NextRequest): NextRequest {
  const mount = appBasePath();
  if (!mount) return req;
  const url = new URL(req.url);
  if (url.pathname === mount || url.pathname.startsWith(`${mount}/`)) return req;
  url.pathname = `${mount}${url.pathname}`;
  return new NextRequest(url, req);
}

export function GET(req: NextRequest) {
  return handlers.GET(withAuthBasePath(req));
}

export function POST(req: NextRequest) {
  return handlers.POST(withAuthBasePath(req));
}
