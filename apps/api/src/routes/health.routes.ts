import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  let redisStatus = 'disconnected';
  try {
    const redis = getRedisClient();
    const pong = await redis.ping();
    redisStatus = pong === 'PONG' ? 'connected' : 'error';
  } catch {
    redisStatus = 'error';
  }

  const healthy = mongoStatus === 'connected' && redisStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
      },
      version: '1.0.0',
    },
  });
});

export { router as healthRouter };
