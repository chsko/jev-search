import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createPortal } from "@/lib/billing";

/**
 * Opens Stripe's customer portal, for the account menu's "Manage
 * subscription" link. Anyone without a Stripe customer lands on the Pro page.
 */
export async function GET() {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: "/pro/manage" });
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  redirect((await createPortal({ userId, origin })) ?? "/pro");
}
