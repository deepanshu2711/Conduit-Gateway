import { IpRuleRepository } from "./ipRule.repository.js";
import { CreateIpFilterBody, UpdateIpFilterBody } from "./ipRule.schema.js";

export const IpRuleService = {
  getAll: async () => {
    const data = await IpRuleRepository.getAll();
    return data;
  },
  create: async (payload: CreateIpFilterBody) => {
    const data = await IpRuleRepository.create(payload);
    return data;
  },
  update: async (id: string, payload: UpdateIpFilterBody) => {
    const data = await IpRuleRepository.update(id, payload);
    return data;
  },
  delete: async (id: string) => {
    const data = await IpRuleRepository.delete(id);
    return data;
  },
};
