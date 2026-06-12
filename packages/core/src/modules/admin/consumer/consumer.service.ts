import { ConsumerRepository } from "./consumer.repository.js";
import { CreateConsumerBody, UpdateConsumerBody } from "./consumer.schema.js";

export const ConsumerService = {
  findAll: async () => {
    const data = await ConsumerRepository.getAll();
    return data;
  },
  create: async (payload: CreateConsumerBody) => {
    const data = await ConsumerRepository.create(payload);
    return data;
  },
  update: async (id: string, payload: UpdateConsumerBody) => {
    const data = await ConsumerRepository.update(id, payload);
    return data;
  },
  delete: async (id: string) => {
    const data = await ConsumerRepository.delete(id);
    return data;
  },
};
