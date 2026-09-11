import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { isTokenBlacklisted } from '../services/auth.service.js';
import { ApiError } from './errorHandler.js';
import type { TokenPayload } from '@govconnect/shared-types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      accessToken?: string;
    }
  }
}

/**
 * Authentication middleware.
 * Verifies JWT access token and checks token blacklist.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'Access token required');
    }

    // Check if token is blacklisted (logged out)
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      throw new ApiError(401, 'Token has been revoked');
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;

    req.user = decoded;
    req.accessToken = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'Access token has expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid access token'));
    } else {
      next(new ApiError(401, 'Authentication failed'));
    }
  }
}

/**
 * Optional authentication — attaches user if token present, but does not fail.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) return next();

    const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
    req.user = decoded;
    req.accessToken = token;
    next();
  } catch {
    // Token invalid or expired — continue without user
    next();
  }
}
