import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import * as IpRuleController from "./ipRule.controller.js";
import { createIpFilteSchema, updateIpFilterSchema } from "./ipRule.schema.js";

export const ipRuleRoutes = (app: FastifyInstance) => {
  app.get("/", IpRuleController.getAll);
  app
    .withTypeProvider<ZodTypeProvider>()
    .post("/", { schema: createIpFilteSchema }, IpRuleController.create);
  app
    .withTypeProvider<ZodTypeProvider>()
    .patch("/:id", { schema: updateIpFilterSchema }, IpRuleController.update);

  app.delete("/:id", IpRuleController.deleteRule);
};
