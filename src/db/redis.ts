// db/redis.ts
import { createClient, RedisClientType } from 'redis';

const client: RedisClientType = createClient({
  url: 'redis://localhost:6379',
  password: '',
});

async function connectRedis(): Promise<void> {
  try {
    await client?.connect();
    console.log('Redis connected');
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
}

export { client, connectRedis };
