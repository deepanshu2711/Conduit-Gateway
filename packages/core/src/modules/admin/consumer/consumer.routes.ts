import { FastifyInstance } from "fastify";
import * as ConsumerController from "./consumer.controller.js";
import {
  createConsumerSchema,
  updateConsumerSchema,
} from "./consumer.schema.js";
import { ZodTypeProvider } from "@fastify/type-provider-zod";

export const consumerRoutes = (app: FastifyInstance) => {
  app.get("/", ConsumerController.getAll);
  app
    .withTypeProvider<ZodTypeProvider>()
    .post("/", { schema: createConsumerSchema }, ConsumerController.create);
  app
    .withTypeProvider<ZodTypeProvider>()
    .patch("/:id", { schema: updateConsumerSchema }, ConsumerController.update);

  app.delete("/:id", ConsumerController.deleteConsumer);
};
