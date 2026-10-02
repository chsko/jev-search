import type { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { forgetCustomer } from "@/lib/billing";
import { forgetUser } from "@/lib/quota";
import { trackEvent } from "@/lib/stats";

/**
 * Clerk's webhook (needs CLERK_WEBHOOK_SIGNING_SECRET). Counts sign-ups for
 * Web Analytics (`user.created`). When someone deletes their account
 * (`user.deleted`), deletes what Quairy keeps about them and stops their
 * subscription from renewing, as the privacy policy promises.
 */
export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch (error) {
    console.error("Clerk webhook verification failed", error);
    return new Response("Bad signature", { status: 400 });
  }

  if (event.type === "user.created") await trackEvent("Signup");
  if (event.type === "user.deleted" && event.data.id) {
    const userId = event.data.id;
    await Promise.all([forgetUser(userId), forgetCustomer(userId)]);
  }
  return Response.json({ received: true });
}
