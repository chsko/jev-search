"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * Reloads the signed-in user in the browser, so the account menu sees the
 * subscription the server just copied into their Clerk metadata.
 */
export function RefreshUser() {
  const { user } = useUser();
  const id = user?.id;
  useEffect(() => {
    user?.reload().catch(() => {});
    // Once per user: reloading hands back a new user object, which mustn't reload again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return null;
}
