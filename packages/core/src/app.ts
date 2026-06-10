import Fastify from "fastify";
import replyFrom from "@fastify/reply-from";

import { routeRoutes } from "./modules/admin/routes/routes.routes.js";
import { gatewayHandler } from "./modules/proxy/gateway.handler.js";
import { AppError } from "./lib/errors.js";

export const app = Fastify({
  logger: true,
});

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof AppError) {
    return reply
      .code(error.statusCode)
      .send({ success: false, message: error.message });
  }

  const err = error as Record<string, unknown>;
  const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;

  return reply.code(statusCode).send({
    success: false,
    message:
      typeof err.message === "string" ? err.message : "Internal Server Error",
  });
});

app.register(replyFrom);
app.get("/health", async () => {
  return {
    status: "ok",
  };
});

app.register(routeRoutes, {
  prefix: "/api/v1/admin/routes",
});

app.all("/*", gatewayHandler);
