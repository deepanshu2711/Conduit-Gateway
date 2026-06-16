import z from "zod";

export const createIpFilteSchema = {
  body: z.object({
    name: z.string().optional(),
    cidr: z.string(),
    type: z.enum(["ALLOW", "DENY"]),
    isActive: z.boolean().optional(),
  }),
};

export const updateIpFilterSchema = {
  body: z.object({
    name: z.string().optional(),
    cidr: z.string().optional(),
    type: z.enum(["ALLOW", "DENY"]).optional(),
    isActive: z.boolean().optional(),
  }),
};

export type CreateIpFilterBody = z.output<typeof createIpFilteSchema.body>;
export type UpdateIpFilterBody = z.output<typeof updateIpFilterSchema.body>;
