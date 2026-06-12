import { Prisma } from "../../../generated/prisma/client.js";
import { NotFoundError } from "../../../lib/errors.js";
import { prisma } from "../../../lib/prisma.js";
import { CreateConsumerBody, UpdateConsumerBody } from "./consumer.schema.js";

export const ConsumerRepository = {
  getAll: async () => {
    const consumers = await prisma.consumer.findMany();
    return consumers;
  },
  create: async (data: CreateConsumerBody) => {
    const conumer = await prisma.consumer.create({ data });
    return conumer;
  },
  update: async (id: string, data: UpdateConsumerBody) => {
    const consumer = await prisma.consumer.update({ where: { id }, data });
    return consumer;
  },
  delete: async (id: string) => {
    try {
      const consumer = await prisma.consumer.delete({ where: { id } });
      return consumer;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new NotFoundError("Consumer not found");
      }
      throw e;
    }
  },
};
