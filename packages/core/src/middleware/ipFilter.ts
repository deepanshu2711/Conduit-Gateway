import ipaddr from "ipaddr.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { error } from "../utils/responses.js";

const parseClientIp = (ip: string) => {
  const addr = ipaddr.parse(ip);
  if (addr.kind() === "ipv6" && (addr as ipaddr.IPv6).isIPv4MappedAddress()) {
    return (addr as ipaddr.IPv6).toIPv4Address();
  }
  return addr;
};

export const ipFilter = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const rules = await prisma.ipRule.findMany({ where: { isActive: true } });
  if (rules.length === 0) return;

  const clientIp = parseClientIp(request.ip);
  const allowRules = rules.filter((r) => r.type === "ALLOW");
  const denyRules = rules.filter((r) => r.type === "DENY");

  if (allowRules.length > 0) {
    const allowed = allowRules.some((r) => {
      try {
        return clientIp.match(ipaddr.parseCIDR(r.cidr));
      } catch {
        return false;
      }
    });
    if (!allowed) return error(reply, null, 403, "Access denied");
  }

  if (denyRules.length > 0) {
    const denied = denyRules.some((r) => {
      try {
        return clientIp.match(ipaddr.parseCIDR(r.cidr));
      } catch {
        return false;
      }
    });
    if (denied) return error(reply, null, 403, "Access denied");
  }
};
