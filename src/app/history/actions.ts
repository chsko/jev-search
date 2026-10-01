"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { clearHistory } from "@/lib/quota";

export async function clearSearchHistory() {
  const { userId } = await auth();
  if (!userId) return;
  await clearHistory(userId);
  revalidatePath("/history");
}
