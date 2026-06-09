import { RouteRespository } from "./routes.repository.js";
import { CreateRouteBody, UpdateRouteBody } from "./routes.schema.js";

export const RouteService = {
  getAll: async () => {
    return RouteRespository.findAll();
  },
  create: async (data: CreateRouteBody) => {
    return RouteRespository.create(data);
  },
  delete: async (id: string) => {
    return RouteRespository.delete(id);
  },
  update: async (id: string, data: UpdateRouteBody) => {
    return RouteRespository.updateById(id, data);
  },
};
