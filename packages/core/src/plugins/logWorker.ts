import { Worker } from "bullmq";
import { prisma } from "../lib/prisma.js";
import { redis } from "./redis.js";

export const startLogWorker = () => {
  new Worker(
    "request-log",
    async (job) => {
      await prisma.requestLog.create({ data: job.data });
    },
    { connection: redis },
  );
};
