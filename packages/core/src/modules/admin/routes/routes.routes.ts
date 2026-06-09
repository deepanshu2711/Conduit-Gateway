import { FastifyInstance } from "fastify";
import * as RouteController from "./routes.controller.js";
import { ZodTypeProvider } from "@fastify/type-provider-zod";
import { createRouteSchema, updateRouteSchema } from "./routes.schema.js";

export const routeRoutes = (app: FastifyInstance) => {
  app.get("/", RouteController.getAllRoutes);
  app
    .withTypeProvider<ZodTypeProvider>()
    .post("/", { schema: createRouteSchema }, RouteController.create);
  app.delete("/:id", RouteController.deleteRoute);
  app.patch("/:id", { schema: updateRouteSchema }, RouteController.update);
};
