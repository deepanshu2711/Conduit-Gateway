import type { FastifyRequest, FastifyReply } from "fastify";
import { findRoute } from "./route.js";
import { forwarder } from "./forwarder.js";
import { error } from "../../utils/responses.js";
import {
  checkRateLimit,
  sendRateLimitResponse,
} from "../../middleware/rateLimiter.js";

export const gatewayHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const path = request.url.split("?")[0]!;
  const route = await findRoute(path);
  if (!request.consumer) return error(reply, null, 401, "Unauthorized");

  if (!route) {
    return error(reply, null, 404, "No route found");
  }

  const rateLimit = await checkRateLimit(route.id);
  if (rateLimit) {
    const sent = sendRateLimitResponse(reply, rateLimit);
    if (sent) return sent;
  }

  return forwarder(request, reply, route);
};
