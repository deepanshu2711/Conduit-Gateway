import { FastifyReply, FastifyRequest } from "fastify";
import { RateLimitingService } from "./rateLimiting.services.js";
import { success } from "../../../utils/responses.js";
import {
  CreateRateLimitRuleBody,
  UpdateRateLimitRuleBody,
} from "./rateLimiting.schema.js";

export const getAllRules = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const data = await RateLimitingService.getRules();
  return success(reply, data);
};

export const createRule = async (
  request: FastifyRequest<{ Body: CreateRateLimitRuleBody }>,
  reply: FastifyReply,
) => {
  const data = await RateLimitingService.createRule(request.body);
  return success(reply, data);
};

export const updateRule = async (
  request: FastifyRequest<{
    Body: UpdateRateLimitRuleBody;
    Params: { id: string };
  }>,
  reply: FastifyReply,
) => {
  const data = await RateLimitingService.updateRule(
    request.params.id,
    request.body,
  );
  return success(reply, data);
};

export const deleteRule = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const data = await RateLimitingService.deleteRule(request.params.id);
  return success(reply, data);
};
