import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Ratelimit } from "@upstash/ratelimit";
import { getSubscription, isPro } from "./billing";
import { FREE_DAILY_EXTRAS, FREE_DAILY_SEARCHES, HISTORY_SIZE } from "./pricing";
import { getRedis } from "./redis";
import { isTimeFormat, type TimeFormat } from "./timezone";

export type Access =
  | { status: "ok"; plan: "pro" | "free" | "bot"; remaining?: number }
  /** A free visitor has used today's allowance. */
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
const hashId = (...parts: string[]) =>
  createHash("sha256")
    .update(parts.map((p) => p.trim().toLowerCase()).join("\u0000"))
    .digest("base64url")
    .slice(0, 16);
const historyKey = (userId: string) => `history:${userId}`;
const timeZoneKey = (userId: string) => `timezone:${userId}`;
const timeFormatKey = (userId: string) => `timeformat:${userId}`;

type Allowance = {
  /** Redis key prefix, one set of request ids per visitor per day. */
  prefix: string;
  limit: number;
};

const SEARCHES: Allowance = { prefix: "quota", limit: FREE_DAILY_SEARCHES };
const EXTRAS: Allowance = { prefix: "extras", limit: FREE_DAILY_EXTRAS };

/**
 * Counts one request against a free visitor's daily allowance. Visitors are
 * counted by account when signed in and by IP otherwise; each distinct request
 * id counts once a day, so reloading or repeating it is free.
 */
async function useAllowance(
  userId: string | null,
  { prefix, limit }: Allowance,
  id: string,
): Promise<Access> {
  const redis = getRedis();
  const key = `${prefix}:${userId ? `user:${userId}` : `ip:${await clientIp()}`}:${today()}`;
  const [seen, used] = await Promise.all([redis.sismember(key, id), redis.scard(key)]);
  // Already counted today, so it says nothing new about what's left.
  if (seen) return { status: "ok", plan: "free" };
  if (used >= limit) return { status: "limit", limit };
  await redis.pipeline().sadd(key, id).expire(key, 60 * 60 * 48).exec();
  return { status: "ok", plan: "free", remaining: limit - used - 1 };
}

/**
 * Whether this request may answer the search `q`, counting it against a free
 * visitor's daily searches. Cached per request, so the page and its metadata
 * count one search. Pro searches are added to the history; link-preview bots
 * aren't counted.
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
    return await useAllowance(userId, SEARCHES, hashId(q));
  } catch (error) {
    // Better to answer than to lock everyone out when Redis is unreachable.
    console.error("Quota check failed", error);
    return { status: "ok", plan: "free" };
  }
});

/**
 * Whether this request may run a comparison or answer a question about a
 * pasted text: the costlier requests, which share their own small daily
 * allowance. `parts` identify the request (the question, and the text), so
 * repeating it is free. Unlimited with Pro.
 */
export const checkExtra = cache(async (...parts: string[]): Promise<Access> => {
  if (!(await checkBurst())) return { status: "slow_down" };
  try {
    const { userId } = await auth();
    if (userId && isPro(await getSubscription(userId))) return { status: "ok", plan: "pro" };
    return await useAllowance(userId, EXTRAS, hashId(...parts));
  } catch (error) {
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

export type TimePreferences = { timeZone: string | null; timeFormat: TimeFormat | null };

/** How a user wants times shown; null for what they haven't chosen yet. */
export async function getTimePreferences(userId: string): Promise<TimePreferences> {
  const [timeZone, timeFormat] = await getRedis().mget<[string | null, string | null]>(
    timeZoneKey(userId),
    timeFormatKey(userId),
  );
  return { timeZone, timeFormat: isTimeFormat(timeFormat) ? timeFormat : null };
}

export async function setTimeZone(userId: string, timeZone: string) {
  await getRedis().set(timeZoneKey(userId), timeZone);
}

export async function setTimeFormat(userId: string, timeFormat: TimeFormat) {
  await getRedis().set(timeFormatKey(userId), timeFormat);
}
