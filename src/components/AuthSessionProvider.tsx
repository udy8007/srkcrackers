"use client";

import { SessionProvider } from "next-auth/react";
import { withAppBase } from "@/lib/app-base-path";

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath={withAppBase("/api/auth") || "/api/auth"}>{children}</SessionProvider>;
}
