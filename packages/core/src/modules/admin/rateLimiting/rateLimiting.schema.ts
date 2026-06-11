import { z } from "zod";

export const createRateLimitRuleSchema = {
  body: z.object({
    routeId: z.string(),
    consumerId: z.string(),
    maxRequests: z.int(),
    windowSec: z.int(),
  }),
};

export const updateRateLimitRuleSchema = {
  body: z.object({
    maxRequests: z.int().optional(),
    windowSec: z.int().optional(),
  }),
};

export type CreateRateLimitRuleBody = z.output<
  typeof createRateLimitRuleSchema.body
>;

export type UpdateRateLimitRuleBody = z.output<
  typeof updateRateLimitRuleSchema.body
>;
