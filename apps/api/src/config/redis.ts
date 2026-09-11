import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let redisClient: Redis | null = null;
let bullmqRedisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 500, 5000);
        logger.warn(`🔄 Redis retry attempt ${times}, next in ${delay}ms`);
        return delay;
      },
      reconnectOnError(err: Error) {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ECONNREFUSED'];
        return targetErrors.some((e) => err.message.includes(e));
      },
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis connection error:', err.message);
    });

    redisClient.on('close', () => {
      logger.warn('⚠️ Redis connection closed');
    });
  }

  return redisClient;
}

export function getBullMQRedisClient(): Redis {
  if (!bullmqRedisClient) {
    bullmqRedisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times: number) {
        return Math.min(times * 500, 5000);
      },
    });

    bullmqRedisClient.on('error', (err) => {
      logger.warn('BullMQ Redis connection error (will retry):', err.message);
    });
  }
  return bullmqRedisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  if (bullmqRedisClient) {
    await bullmqRedisClient.quit();
    bullmqRedisClient = null;
  }
  logger.info('Redis connections disconnected gracefully');
}
