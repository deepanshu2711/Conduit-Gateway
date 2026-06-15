import { createHash } from "node:crypto";
import { redis } from "../plugins/redis.js";

const TTL = 10;

export const buildCacheKey = (method: string, url: string): string => {
  const hash = createHash("md5").update(`${method}:${url}`).digest("hex");
  return `proxy:cache:${hash}`;
};

export const getCachedResponse = async (key: string) => {
  const cached = await redis.get(key);
  if (!cached) return null;

  return JSON.parse(cached) as {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  };
};

export const setCachedResponse = async (
  key: string,
  data: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
  },
) => {
  await redis.setex(key, TTL, JSON.stringify(data));
};
