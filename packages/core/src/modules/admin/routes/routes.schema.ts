import { z } from "zod";

export const createRouteSchema = {
  body: z.object({
    prefix: z.string(),
    targetUrl: z.string(),
    stripPrefix: z.boolean().optional(),
    authRequired: z.boolean().optional(),
    methods: z
      .array(z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]))
      .optional(),
    timeoutMs: z.number().int().optional(),
    isActive: z.boolean().optional(),
    cacheEnabled: z.boolean().optional(),
    cacheTtlSec: z.number().int().min(1).optional(),
  }),
};

export const updateRouteSchema = {
  params: z.object({ id: z.string() }),
  body: z.object({
    prefix: z.string().optional(),
    targetUrl: z.string().optional(),
    stripPrefix: z.boolean().optional(),
    authRequired: z.boolean().optional(),
    methods: z
      .array(z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]))
      .optional(),
    timeoutMs: z.number().int().optional(),
    isActive: z.boolean().optional(),
    cacheEnabled: z.boolean().optional(),
    cacheTtlSec: z.number().int().min(1).optional(),
  }),
};

export type CreateRouteBody = z.output<typeof createRouteSchema.body>;
export type UpdateRouteBody = z.output<typeof updateRouteSchema.body>;
