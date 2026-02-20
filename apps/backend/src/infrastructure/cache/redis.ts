import { createClient, RedisClientType } from "redis";
import { env } from "../../config/env";
import { logger } from "../logger/logger";

let client: RedisClientType | null = null;

export async function connectRedis(): Promise<void> {
  try {
    client = createClient({ url: env.REDIS_URL });

    client.on("error", (err) => {
      logger.warn("Redis client error (non-fatal, cache disabled)", err.message);
    });

    await client.connect();
    logger.info("✅ Redis connected");
  } catch (error) {
    logger.warn("⚠️  Redis not available — running without cache");
    client = null;
  }
}

export async function cacheGet<T = string>(key: string): Promise<T | null> {
  if (!client) return null;
  try {
    const val = await client.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // non-critical
  }
}

export async function cacheDel(pattern: string): Promise<void> {
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(keys);
  } catch {
    // non-critical
  }
}

export function getRedisClient() {
  return client;
}
