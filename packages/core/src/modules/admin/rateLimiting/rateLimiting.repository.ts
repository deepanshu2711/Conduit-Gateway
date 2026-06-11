import { prisma } from "../../../lib/prisma.js";
import {
  CreateRateLimitRuleBody,
  UpdateRateLimitRuleBody,
} from "./rateLimiting.schema.js";

export const RateLimitingRespository = {
  getAll: async () => {
    const rule = await prisma.rateLimitRule.findMany();
    return rule;
  },
  create: async (data: CreateRateLimitRuleBody) => {
    const rule = await prisma.rateLimitRule.create({ data });
    return rule;
  },
  delete: async (id: string) => {
    const rule = await prisma.rateLimitRule.delete({ where: { id } });
    return rule;
  },
  update: async (id: string, data: UpdateRateLimitRuleBody) => {
    const rule = await prisma.rateLimitRule.update({ where: { id }, data });
    return rule;
  },
};
