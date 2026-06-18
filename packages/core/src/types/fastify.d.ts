import type { Consumer } from "../generated/prisma/client.js";

declare module "fastify" {
  interface FastifyRequest {
    consumer?: Consumer;
  }
}
