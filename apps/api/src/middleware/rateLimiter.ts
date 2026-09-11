import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';
import { ApiError } from './errorHandler.js';

function createStore(prefix: string) {
  try {
    const redis = getRedisClient();
    return new RedisStore({
      // @ts-ignore
      sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)),
      prefix: `rl:${prefix}:`,
    });
  } catch {
    return undefined; // Fallback to MemoryStore
  }
}

// 1. Auth rate limiter: 10 requests per minute
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('auth'),
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many authentication attempts. Please try again in 1 minute.', true, undefined, 'RATE_LIMIT_EXCEEDED'));
  },
});
export const authLimiter = authRateLimiter;

// 2. Public rate limiter: 60 requests per minute
export const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('public'),
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Too many requests. Please slow down.', true, undefined, 'RATE_LIMIT_EXCEEDED'));
  },
});
export const publicLimiter = publicRateLimiter;

// 3. Authenticated user rate limiter: 200 requests per minute
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('api'),
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'API rate limit exceeded. Please try again shortly.', true, undefined, 'RATE_LIMIT_EXCEEDED'));
  },
});
export const apiLimiter = apiRateLimiter;

// 4. File upload rate limiter: 15 uploads per minute
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('upload'),
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'Document upload rate limit exceeded. Please wait a moment.', true, undefined, 'RATE_LIMIT_EXCEEDED'));
  },
});
export const uploadLimiter = uploadRateLimiter;

// 5. AI API rate limiter: 25 requests per minute
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore('ai'),
  handler: (_req, _res, next) => {
    next(new ApiError(429, 'AI operations rate limit exceeded. Please try again shortly.', true, undefined, 'RATE_LIMIT_EXCEEDED'));
  },
});
export const aiLimiter = aiRateLimiter;
