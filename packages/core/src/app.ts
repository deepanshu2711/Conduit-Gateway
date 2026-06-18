import Fastify from "fastify";
import replyFrom from "@fastify/reply-from";
import {
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import cors from "@fastify/cors";

import { routeRoutes } from "./modules/admin/routes/routes.routes.js";
import { gatewayHandler } from "./modules/proxy/gateway.handler.js";
import { AppError } from "./lib/errors.js";
import { rateLimitingRoutes } from "./modules/admin/rateLimiting/rateLimiting.routes.js";
import { startLogWorker } from "./plugins/logWorker.js";
import { consumerRoutes } from "./modules/admin/consumer/consumer.routes.js";
import { ipRuleRoutes } from "./modules/admin/ipRule/ipRule.routes.js";
import { ipFilter } from "./middleware/ipFilter.js";
import { enforceAdmin, resolveConsumer } from "./middleware/auth.js";

export const app = Fastify({
  logger: true,
  trustProxy: true,
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

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
startLogWorker();

app.register(cors, {
  origin: process.env.CORS_ORIGIN?.split(",") ?? true,
  methods: process.env.CORS_METHODS?.split(",") ?? [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],
  allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(",") ?? [
    "Content-Type",
    "Authorization",
  ],
  credentials: process.env.CORS_CREDENTIALS !== "false",
  maxAge: Number(process.env.CORS_MAX_AGE) || 86400,
});

app.get("/health", async () => {
  return {
    status: "ok",
  };
});

app.addHook("onRequest", ipFilter);
app.addHook("onRequest", resolveConsumer);

app.addHook("onRequest", (req, reply, done) => {
  if (req.url.startsWith("/api/v1/admin")) {
    return enforceAdmin(req, reply);
  }
  done();
});

app.register(routeRoutes, {
  prefix: "/api/v1/admin/routes",
});
app.register(rateLimitingRoutes, {
  prefix: "/api/v1/admin/rate-limiting",
});
app.register(consumerRoutes, {
  prefix: "/api/v1/admin/consumer",
});
app.register(ipRuleRoutes, {
  prefix: "/api/v1/admin/ip-rule",
});

app.all("/*", gatewayHandler);
