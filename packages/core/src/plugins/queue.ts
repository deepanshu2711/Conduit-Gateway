import { Queue } from "bullmq";
import { redis } from "./redis.js";

export const logQueue = new Queue("request-log", { connection: redis });
