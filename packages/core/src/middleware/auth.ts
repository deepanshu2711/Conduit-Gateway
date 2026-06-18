import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { hashApiKey } from "../utils/helpers/helpers.js";
import { error } from "../utils/responses.js";

export const resolveConsumer = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return;

  const token = authHeader.slice(7);
  const hashedApiKey = hashApiKey(token);

  const consumer = await prisma.consumer.findFirst({
    where: { apiHashKey: hashedApiKey, isActive: true },
  });

  if (!consumer) return;

  request.consumer = consumer;
};

export const enforceAdmin = (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.consumer) return error(reply, null, 401, "No Consumer");
  if (!request.consumer.scopes.includes("admin"))
    return error(reply, null, 403, "Consumer does not have admin scope");
};
