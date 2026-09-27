import "server-only";
import { TypeSafeClient } from "@typesafe-ai/sdk";

let client: TypeSafeClient | undefined;

/** The TypeSafe client, created on first use so a missing key surfaces per request. */
export function getJevClient(): TypeSafeClient {
  // Reads TYPESAFE_API_KEY (and optional TYPESAFE_DEFAULT_MODEL) from the environment.
  client ??= new TypeSafeClient();
  return client;
}
