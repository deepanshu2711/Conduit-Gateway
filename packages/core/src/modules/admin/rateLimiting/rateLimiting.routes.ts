import { FastifyInstance } from "fastify";
import * as RateLimitingController from "./rateLimiting.controller.js";
import {
  createRateLimitRuleSchema,
  updateRateLimitRuleSchema,
} from "./rateLimiting.schema.js";
import { ZodTypeProvider } from "@fastify/type-provider-zod";

export const rateLimitingRoutes = (app: FastifyInstance) => {
  app.get("/", RateLimitingController.getAllRules);
  app
    .withTypeProvider<ZodTypeProvider>()
    .post(
      "/",
      { schema: createRateLimitRuleSchema },
      RateLimitingController.createRule,
    );

  app
    .withTypeProvider<ZodTypeProvider>()
    .patch(
      "/:id",
      { schema: updateRateLimitRuleSchema },
      RateLimitingController.updateRule,
    );
  app.delete("/:id", RateLimitingController.deleteRule);
};
