import type { FastifyRequest, FastifyReply } from "fastify";
import type { Route } from "../../generated/prisma/client.js";

import { HttpMethod } from "../../generated/prisma/enums.js";
import { error } from "../../utils/responses.js";
import { logQueue } from "../../plugins/queue.js";
import { circuitBreaker } from "../circuitBreaker/circuitBreaker.js";

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

  reply.raw.on("error", () => {
    recordOutcome(0);
  });

  reply.from(targetUrl, {
    timeout: route.timeoutMs,
    onResponse: (_request, _reply, res) => {
      recordOutcome(res.statusCode ?? 0);
    },
  });
};
