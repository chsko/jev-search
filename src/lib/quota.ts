import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { getSubscription, isPro } from "./billing";
import { FREE_DAILY_SEARCHES, HISTORY_SIZE } from "./pricing";
import { getRedis } from "./redis";

export type Access =
  | { status: "ok"; plan: "pro" | "free" | "bot"; remaining?: number }
  /** A free visitor has used today's searches. */
  | { status: "limit"; limit: number }
  /** Too many requests in a short time, from anyone. */
  | { status: "slow_down" };

let burst: Ratelimit | undefined;

/** Protects the Jev budget from scripts: 30 requests a minute per IP, whatever the plan. */
function getBurstLimit() {
  burst ??= new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    prefix: "quairy:burst",
    ephemeralCache: new Map(),
  });
  return burst;
}

async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Throttles bursts of requests from one IP. Fails open if Redis is down. */
export async function checkBurst(): Promise<boolean> {
  try {
    return (await getBurstLimit().limit(await clientIp())).success;
  } catch (error) {
    console.error("Rate limit check failed", error);
    return true;
  }
}

const today = () => new Date().toISOString().slice(0, 10);
const questionId = (q: string) =>
  createHash("sha256").update(q.trim().toLowerCase()).digest("base64url").slice(0, 16);
const historyKey = (userId: string) => `history:${userId}`;

/**
 * Whether this request may answer `q`, counting it against a free visitor's
 * daily allowance. Cached per request, so the page and its metadata count one
 * search. Free visitors are counted by account when signed in and by IP
 * otherwise; each distinct question counts once a day, so reloading or going
 * back to an answer is free. Link-preview bots aren't counted.
 */
export const checkSearch = cache(async (q: string): Promise<Access> => {
  if (!(await checkBurst())) return { status: "slow_down" };
  if (userAgent({ headers: await headers() }).isBot) return { status: "ok", plan: "bot" };

  try {
    const { userId } = await auth();
    if (userId && isPro(await getSubscription(userId))) {
      await getRedis()
        .pipeline()
        .zadd(historyKey(userId), { score: Date.now(), member: q })
        .zremrangebyrank(historyKey(userId), 0, -(HISTORY_SIZE + 1))
        .exec();
      return { status: "ok", plan: "pro" };
    }

    const redis = getRedis();
    const key = `quota:${userId ? `user:${userId}` : `ip:${await clientIp()}`}:${today()}`;
    const id = questionId(q);
    const [seen, used] = await Promise.all([redis.sismember(key, id), redis.scard(key)]);
    // Already counted today, so it says nothing new about what's left.
    if (seen) return { status: "ok", plan: "free" };
    if (used >= FREE_DAILY_SEARCHES) return { status: "limit", limit: FREE_DAILY_SEARCHES };
    await redis.pipeline().sadd(key, id).expire(key, 60 * 60 * 48).exec();
    return { status: "ok", plan: "free", remaining: FREE_DAILY_SEARCHES - used - 1 };
  } catch (error) {
    // Better to answer than to lock everyone out when Redis is unreachable.
    console.error("Quota check failed", error);
    return { status: "ok", plan: "free" };
  }
});

export async function getHistory(userId: string) {
  const entries = await getRedis().zrange<(string | number)[]>(historyKey(userId), 0, 99, {
    rev: true,
    withScores: true,
  });
  const history: { q: string; at: number }[] = [];
  for (let i = 0; i < entries.length; i += 2) {
    history.push({ q: String(entries[i]), at: Number(entries[i + 1]) });
  }
  return history;
}

export async function clearHistory(userId: string) {
  await getRedis().del(historyKey(userId));
}
