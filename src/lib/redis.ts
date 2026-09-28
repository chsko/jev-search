import "server-only";
import { Redis } from "@upstash/redis";

let redis: Redis | undefined;

/** Upstash Redis, from the env vars the Vercel integration provisions. */
export function getRedis(): Redis {
  redis ??= new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
  return redis;
}
