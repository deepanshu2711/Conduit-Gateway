import { FastifyReply, FastifyRequest } from "fastify";
import { IpRuleService } from "./ipRule.service.js";
import { CreateIpFilterBody, UpdateIpFilterBody } from "./ipRule.schema.js";
import { success } from "../../../utils/responses.js";

export const getAll = async (request: FastifyRequest, reply: FastifyReply) => {
  const data = await IpRuleService.getAll();
  return success(reply, data);
};

export const create = async (
  request: FastifyRequest<{ Body: CreateIpFilterBody }>,
  reply: FastifyReply,
) => {
  const data = await IpRuleService.create(request.body);
  return success(reply, data);
};

export const update = async (
  request: FastifyRequest<{ Body: UpdateIpFilterBody; Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const data = await IpRuleService.update(request.params.id, request.body);
  return success(reply, data);
};

export const deleteRule = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const data = await IpRuleService.delete(request.params.id);
  return success(reply, data);
};
