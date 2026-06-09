import { FastifyReply, FastifyRequest } from "fastify";

export const success = (
  reply: FastifyReply,
  data: any,
  statusCode = 200,
  message = "Success",
) => {
  return reply.code(statusCode).send({ success: true, message, data });
};

export const error = (
  reply: FastifyReply,
  data?: any,
  statusCode = 500,
  message = "Internal Server Error",
) => {
  return reply.code(statusCode).send({ success: false, message, data });
};
