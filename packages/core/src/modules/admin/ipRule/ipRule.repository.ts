import { Prisma } from "../../../generated/prisma/client.js";
import { NotFoundError } from "../../../lib/errors.js";
import { prisma } from "../../../lib/prisma.js";
import { CreateIpFilterBody, UpdateIpFilterBody } from "./ipRule.schema.js";

export const IpRuleRepository = {
  getAll: async () => {
    const ipRules = await prisma.ipRule.findMany();
    return ipRules;
  },
  create: async (data: CreateIpFilterBody) => {
    const ipRule = await prisma.ipRule.create({ data });
    return ipRule;
  },
  update: async (id: string, data: UpdateIpFilterBody) => {
    try {
      const ipRule = await prisma.ipRule.update({ where: { id }, data });
      return ipRule;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new NotFoundError("Ip rule not found");
      }
      throw e;
    }
  },
  delete: async (id: string) => {
    try {
      const ipRule = await prisma.ipRule.delete({ where: { id } });
      return ipRule;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new NotFoundError("Ip rule not found");
      }
      throw e;
    }
  },
};
