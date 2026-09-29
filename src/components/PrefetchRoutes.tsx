"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Prefetches routes reached by links Next.js can't see, such as Clerk's. */
export function PrefetchRoutes({ routes }: { routes: string[] }) {
  const router = useRouter();
  useEffect(() => {
    for (const route of routes) router.prefetch(route);
  }, [router, routes]);
  return null;
}
