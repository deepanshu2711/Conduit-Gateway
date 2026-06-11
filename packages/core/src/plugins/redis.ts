import Redis from "ioredis";

const redisConfig = {
  maxRetriesPerRequest: null,
};

export const redis = new Redis(redisConfig);
