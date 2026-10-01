"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { clearHistory, setTimeZone } from "@/lib/quota";
import { isTimeZone } from "@/lib/timezone";

export async function clearSearchHistory() {
  const { userId } = await auth();
  if (!userId) return;
  await clearHistory(userId);
  revalidatePath("/history");
}

/** Saves the time zone the history's timestamps are shown in. */
export async function saveTimeZone(timeZone: string) {
  const { userId } = await auth();
  if (!userId || !isTimeZone(timeZone)) return;
  await setTimeZone(userId, timeZone);
  revalidatePath("/history");
}
