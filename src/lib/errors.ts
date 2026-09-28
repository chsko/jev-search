import { APIError, TypeSafeError } from "@typesafe-ai/sdk";

/** A user-facing message for a failed Jev request. */
export function describeError(error: unknown): string {
  if (error instanceof APIError) {
    if (error.status === 401 || error.status === 403) {
      return "Quairy isn’t authorised to call its answer service. Check the TYPESAFE_API_KEY setting.";
    }
    if (error.status === 429) return "Quairy is busy right now. Please try again in a moment.";
    return "Quairy couldn’t answer right now. Please try again.";
  }
  if (error instanceof TypeSafeError && /api key/i.test(error.message)) {
    return "Quairy isn’t configured yet: set TYPESAFE_API_KEY on the server.";
  }
  return "Quairy couldn’t reach its answer service. Please try again.";
}
