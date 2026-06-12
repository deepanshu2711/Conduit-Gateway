import { Redis } from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisConfig);
