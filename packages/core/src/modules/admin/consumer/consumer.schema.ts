import { z } from "zod";

export const createConsumerSchema = {
  body: z.object({
    name: z.string(),
    scopes: z.array(z.enum(["read", "write", "admin"])),
  }),
};

export const updateConsumerSchema = {
  body: z.object({
    name: z.string().optional(),
    scopes: z.array(z.enum(["read", "write", "admin"])).optional(),
  }),
};

export type CreateConsumerBody = z.output<typeof createConsumerSchema.body>;
export type UpdateConsumerBody = z.output<typeof updateConsumerSchema.body>;
