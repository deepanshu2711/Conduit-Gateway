import { prisma } from "../../lib/prisma.js";

export const findRoute = async (path: string) => {
  const routes = await prisma.route.findMany({ where: { isActive: true } });
  return routes
    .filter((r) => {
      if (!path.startsWith(r.prefix)) return false;
      const next = path[r.prefix.length];
      return path.length === r.prefix.length || next === "/" || next === "?";
    })
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
};
