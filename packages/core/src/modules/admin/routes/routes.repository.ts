import { Prisma } from "../../../generated/prisma/client.js";
import { prisma } from "../../../lib/prisma.js";
import { CreateRouteBody, UpdateRouteBody } from "./routes.schema.js";
import { ConflictError, NotFoundError } from "../../../lib/errors.js";

export const RouteRespository = {
  findAll: async () => {
    return prisma.route.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
  },
  create: async (data: CreateRouteBody) => {
    try {
      return await prisma.route.create({ data });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictError("A route with this prefix already exists");
      }
      throw e;
    }
  },
  delete: async (id: string) => {
    try {
      return await prisma.route.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new NotFoundError("Route not found");
      }
      throw e;
    }
  },
  updateById: async (id: string, data: UpdateRouteBody) => {
    try {
      return await prisma.route.update({ where: { id }, data });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new NotFoundError("Route Not Found");
      }

      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictError("A Route with this prefix already exists");
      }
      throw e;
    }
  },
};
