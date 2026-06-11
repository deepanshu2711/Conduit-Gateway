import type { FastifyRequest, FastifyReply } from "fastify";
import type { Route } from "../../generated/prisma/client.js";

import { HttpMethod } from "../../generated/prisma/enums.js";
import { error } from "../../utils/responses.js";
import { logQueue } from "../../plugins/queue.js";

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

  const startTime = Date.now();
  reply.from(targetUrl, {
    timeout: route.timeoutMs,
    onResponse: (_request, _reply, res) => {
      const latency = Date.now() - startTime;
      logQueue.add("log", {
        routeId: route.id,
        method: request.method.toUpperCase() as HttpMethod,
        path: request.url,
        statusCode: res.statusCode ?? 0,
        latency,
        ip: request.ip,
      });
    },
  });
};
