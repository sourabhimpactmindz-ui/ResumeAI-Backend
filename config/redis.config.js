import IORedis from 'ioredis'

export const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  family: 0,
});

connection.on("error", (err) => console.error("Redis error:", err.message));