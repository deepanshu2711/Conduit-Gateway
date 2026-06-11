import { Prisma } from "../../../generated/prisma/client.js";
import { ConflictError, NotFoundError } from "../../../lib/errors.js";
import { RateLimitingRespository } from "./rateLimiting.repository.js";
import {
  CreateRateLimitRuleBody,
  UpdateRateLimitRuleBody,
} from "./rateLimiting.schema.js";

export const RateLimitingService = {
  getRules: async () => {
    const rule = await RateLimitingRespository.getAll();
    return rule;
  },
  createRule: async (data: CreateRateLimitRuleBody) => {
    try {
      return await RateLimitingRespository.create(data);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictError(
          "A rate limit rule already exists for this route and consumer.",
        );
      }
      throw e;
    }
  },
  updateRule: async (id: string, data: UpdateRateLimitRuleBody) => {
    return await RateLimitingRespository.update(id, data);
  },
  deleteRule: async (id: string) => {
    try {
      return await RateLimitingRespository.delete(id);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        throw new NotFoundError("Rate limit rule not found");
      }
      throw e;
    }
  },
};
