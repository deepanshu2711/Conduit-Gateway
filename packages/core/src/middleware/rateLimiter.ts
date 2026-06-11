import { FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { redis } from "../plugins/redis.js";

export interface RateLimitResult {
  allowed: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}

export const checkRateLimit = async (
  routeId: string,
): Promise<RateLimitResult | null> => {
  const rule = await prisma.rateLimitRule.findFirst({
    where: { routeId },
  });
  if (!rule) return null;

  const key = `rateLimit:${routeId}`;
  const count = await redis.incr(key);

  if (count === 1) await redis.expire(key, rule.windowSec);
  const ttl = await redis.ttl(key);

  if (count > rule.maxRequests) {
    return {
      allowed: false,
      limit: rule.maxRequests,
      remaining: 0,
      reset: ttl,
    };
  } else {
    return {
      allowed: true,
      limit: rule.maxRequests,
      remaining: rule.maxRequests - count,
      reset: ttl,
    };
  }
};

export function sendRateLimitResponse(
  reply: FastifyReply,
  result: RateLimitResult,
) {
  if (result.limit !== undefined) {
    reply.header("X-RateLimit-Limit", result.limit);
  }
  if (result.remaining !== undefined) {
    reply.header("X-RateLimit-Remaining", result.remaining);
  }
  if (result.reset !== undefined) {
    reply.header("X-RateLimit-Reset", result.reset);
    if (!result.allowed) {
      reply.header("Retry-After", result.reset);
    }
  }
  if (!result.allowed) {
    return reply
      .code(429)
      .send({ success: false, message: "Too Many Requests" });
  }
}
