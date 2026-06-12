import { FastifyReply, FastifyRequest } from "fastify";
import { ConsumerService } from "./consumer.service.js";
import { success } from "../../../utils/responses.js";
import { CreateConsumerBody, UpdateConsumerBody } from "./consumer.schema.js";

export const getAll = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = await ConsumerService.findAll();
  return success(reply, data);
};

export const create = async (
  request: FastifyRequest<{ Body: CreateConsumerBody }>,
  reply: FastifyReply,
) => {
  const data = await ConsumerService.create(request.body);
  return success(reply, data);
};

export const update = async (
  request: FastifyRequest<{ Body: UpdateConsumerBody; Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const data = await ConsumerService.update(request.params.id, request.body);
  return success(reply, data);
};

export const deleteConsumer = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const data = await ConsumerService.delete(request.params.id);
  return success(reply, data);
};
