"use client";

import { useEffect, useState } from "react";

/** Returns true only after the component has mounted on the client.
 *  Use to gate rendering of persisted/client-only state and avoid
 *  hydration mismatches. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
