import type { FastifyRequest, FastifyReply } from "fastify";
import type { Route } from "../../generated/prisma/client.js";

import { HttpMethod } from "../../generated/prisma/enums.js";
import { error } from "../../utils/responses.js";
import { logQueue } from "../../plugins/queue.js";
import { circuitBreaker } from "../circuitBreaker/circuitBreaker.js";
import {
  buildCacheKey,
  getCachedResponse,
  setCachedResponse,
} from "../../utils/cache.js";

export const forwarder = async (
  request: FastifyRequest,
  reply: FastifyReply,
  route: Route,
) => {
  if (!route.methods.includes(request.method as HttpMethod)) {
    return error(reply, null, 405, "Method not allowed");
  }

  const targetPath = route.stripPrefix
    ? request.url.replace(route.prefix, "") || "/"
    : request.url;

  const targetUrl = `${route.targetUrl.replace(/\/$/, "")}${targetPath}`;

  const allowed = await circuitBreaker.allowRequest(targetUrl);
  if (!allowed) {
    return error(
      reply,
      null,
      503,
      "Service Unavailable (circuit breaker open)",
    );
  }

  const startTime = Date.now();
  let responded = false;

  const recordOutcome = (statusCode: number) => {
    if (responded) return;
    responded = true;

    if (statusCode >= 500 || statusCode === 0) {
      circuitBreaker.recordFailure(targetUrl);
    } else {
      circuitBreaker.recordSuccess(targetUrl);
    }

    logQueue.add("log", {
      routeId: route.id,
      method: request.method.toUpperCase() as HttpMethod,
      path: request.url,
      statusCode,
      latency: Date.now() - startTime,
      ip: request.ip,
    });
  };

  try {
    const shouldCache =
      (request.method === "GET" || request.method === "HEAD") &&
      !request.headers.authorization;
    const cacheKey = buildCacheKey(request.method, request.url);

    if (shouldCache) {
      const cached = await getCachedResponse(cacheKey);

      if (cached) {
        const skipHeaders = new Set([
          "transfer-encoding",
          "connection",
          "keep-alive",
        ]);

        for (const [key, value] of Object.entries(cached.headers)) {
          if (!skipHeaders.has(key.toLowerCase())) {
            reply.header(key, value);
          }
        }

        recordOutcome(cached.statusCode);
        return reply.code(cached.statusCode).send(cached.body);
      }
    }
    const upstreamRes = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers as Record<string, string>,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : (request.body as any),
    });

    const statusCode = upstreamRes.status;
    const headers: Record<string, string> = {};
    upstreamRes.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (
        ![
          "transfer-encoding",
          "connection",
          "keep-alive",
          "content-encoding",
        ].includes(lower)
      ) {
        headers[key] = value;
      }
    });
    const body = await upstreamRes.text();
    Object.entries(headers).forEach(([key, value]) => {
      reply.header(key, value);
    });

    if (shouldCache && statusCode >= 200 && statusCode < 300) {
      await setCachedResponse(cacheKey, {
        statusCode,
        headers,
        body,
      });
    }

    recordOutcome(statusCode);

    return reply.code(statusCode).send(body);
  } catch (e) {
    recordOutcome(0);
    return error(reply, null, 502, "Bad Gateway");
  }
};
