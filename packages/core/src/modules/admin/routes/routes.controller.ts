import { FastifyReply, FastifyRequest } from "fastify";
import { RouteService } from "./routes.services.js";
import { success } from "../../../utils/responses.js";
import { CreateRouteBody, UpdateRouteBody } from "./routes.schema.js";

export const getAllRoutes = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const route = await RouteService.getAll();
  return success(reply, route);
};

export const create = async (
  request: FastifyRequest<{ Body: CreateRouteBody }>,
  reply: FastifyReply,
) => {
  const route = await RouteService.create(request.body);
  return success(reply, route);
};

export const deleteRoute = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  await RouteService.delete(id);
  return success(reply, null);
};

export const update = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateRouteBody }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  const route = await RouteService.update(id, request.body);
  return success(reply, route);
};
