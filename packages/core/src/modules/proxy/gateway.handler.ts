import type { FastifyRequest, FastifyReply } from "fastify";
import { findRoute } from "./route.js";
import { forwarder } from "./forwarder.js";
import { error } from "../../utils/responses.js";

export const gatewayHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const path = request.url.split("?")[0]!;
  const route = await findRoute(path);

  if (!route) {
    return error(reply, null, 404, "No route found");
  }

  return forwarder(request, reply, route);
};
