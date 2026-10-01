"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { changeInterval, createCardUpdate, setCancelAtPeriodEnd } from "@/lib/billing";
import { setTimeFormat, setTimeZone } from "@/lib/quota";
import { isTimeFormat, isTimeZone, type TimeFormat } from "@/lib/timezone";

async function signedIn() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/settings");
  return userId;
}

const done = () => revalidatePath("/settings", "layout");

export async function switchInterval(formData: FormData) {
  const interval = formData.get("interval") === "year" ? "year" : "month";
  await changeInterval(await signedIn(), interval);
  done();
}

export async function cancelSubscription() {
  await setCancelAtPeriodEnd(await signedIn(), true);
  done();
}

export async function resumeSubscription() {
  await setCancelAtPeriodEnd(await signedIn(), false);
  done();
}

/** Opens Stripe's card form, which comes back to the subscription settings. */
export async function updateCard() {
  const userId = await signedIn();
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;
  const url = await createCardUpdate({ userId, returnUrl: `${origin}/settings/subscription` });
  redirect(url ?? "/settings/subscription");
}

/** Saves the time zone timestamps are shown in. */
export async function saveTimeZone(timeZone: string) {
  const { userId } = await auth();
  if (!userId || !isTimeZone(timeZone)) return;
  await setTimeZone(userId, timeZone);
  revalidatePath("/history");
  done();
}

/** Saves whether times are shown on a 12- or 24-hour clock. */
export async function saveTimeFormat(timeFormat: TimeFormat) {
  const { userId } = await auth();
  if (!userId || !isTimeFormat(timeFormat)) return;
  await setTimeFormat(userId, timeFormat);
  revalidatePath("/history");
  done();
}
