import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { User, type IUser } from '../models/User.js';
import { Citizen } from '../models/Citizen.js';
import { getRedisClient } from '../config/redis.js';
import { ApiError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { AuditService } from './audit.service.js';
import { AuditAction, UserRole } from '@govconnect/shared-types';
import type { TokenPayload } from '@govconnect/shared-types';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const BLACKLIST_PREFIX = 'token:blacklist:';
const REFRESH_TOKEN_PREFIX = 'refresh:';

// ─── Generate Access Token ─────────────────────────────
export function generateAccessToken(user: IUser): string {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  };

  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  } as jwt.SignOptions);
}

// ─── Generate Refresh Token ────────────────────────────
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

// ─── Register ──────────────────────────────────────────
export async function registerUser(
  name: string,
  email: string,
  password: string,
  role?: string,
  extraData?: { phone?: string; dob?: string; aadhaarNumber?: string; panNumber?: string },
) {
  // Check if user exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Only allow citizen registration by default
  const userRole = (role as UserRole) || UserRole.CITIZEN;
  const allowedSelfRegisterRoles = [UserRole.CITIZEN];
  if (!allowedSelfRegisterRoles.includes(userRole)) {
    throw new ApiError(403, 'Cannot self-register with this role');
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: userRole,
  });

  // If registering as a citizen, atomically create Citizen profile
  let citizenProfile = null;
  if (userRole === UserRole.CITIZEN) {
    citizenProfile = await Citizen.create({
      userId: user._id,
      fullName: name,
      dateOfBirth: extraData?.dob ? new Date(extraData.dob) : new Date('1990-01-01'),
      aadhaarNumber: extraData?.aadhaarNumber || '',
      panNumber: extraData?.panNumber || '',
      isIdentityVerified: false,
      contact: {
        email: email.toLowerCase(),
        phone: extraData?.phone || '9876543210',
      },
      address: {
        street: '123 Civil Lines',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
        country: 'India',
      },
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Store refresh token
  await storeRefreshToken(user._id.toString(), refreshToken);

  await AuditService.logEvent({
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    action: AuditAction.USER_CREATED,
    resourceType: 'User',
    resourceId: user._id.toString(),
    details: { email: user.email, role: user.role },
  });

  return {
    user: user.toSafeObject(),
    citizen: citizenProfile,
    accessToken,
    refreshToken,
  };
}

// ─── Login ─────────────────────────────────────────────
export async function loginUser(email: string, password: string, clientIp?: string, userAgent?: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+password +refreshTokens',
  );

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked) {
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 60000,
      );
      throw new ApiError(
        423,
        `Account is locked. Try again in ${minutesLeft} minutes`,
      );
    }
    // Lock expired, reset
    user.isLocked = false;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account has been deactivated');
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;

    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.isLocked = true;
      user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      await user.save();
      throw new ApiError(
        423,
        'Account locked due to too many failed login attempts. Try again in 15 minutes',
      );
    }

    await user.save();
    throw new ApiError(401, 'Invalid email or password');
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.isLocked = false;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Store refresh token
  await storeRefreshToken(user._id.toString(), refreshToken);

  await AuditService.logEvent({
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
    action: AuditAction.USER_LOGIN,
    resourceType: 'User',
    resourceId: user._id.toString(),
    ipAddress: clientIp,
    userAgent,
  });

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken,
  };
}

// ─── Refresh Token ─────────────────────────────────────
export async function refreshAccessToken(oldRefreshToken: string) {
  const redis = getRedisClient();

  // Find which user owns this refresh token
  const userId = await redis.get(`${REFRESH_TOKEN_PREFIX}${oldRefreshToken}`);
  if (!userId) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    await redis.del(`${REFRESH_TOKEN_PREFIX}${oldRefreshToken}`);
    throw new ApiError(401, 'User not found or inactive');
  }

  // Rotate: delete old token, create new one
  await redis.del(`${REFRESH_TOKEN_PREFIX}${oldRefreshToken}`);
  const newRefreshToken = generateRefreshToken();
  await storeRefreshToken(userId, newRefreshToken);

  const accessToken = generateAccessToken(user);

  return {
    user: user.toSafeObject(),
    accessToken,
    refreshToken: newRefreshToken,
  };
}

// ─── Logout ────────────────────────────────────────────
export async function logoutUser(
  refreshToken: string | undefined,
  accessToken: string | undefined,
  userId?: string,
) {
  const redis = getRedisClient();

  // Revoke refresh token
  if (refreshToken) {
    await redis.del(`${REFRESH_TOKEN_PREFIX}${refreshToken}`);
  }

  // Blacklist access token
  if (accessToken) {
    try {
      const decoded = jwt.verify(
        accessToken,
        config.jwt.accessSecret,
      ) as jwt.JwtPayload;
      const ttl = decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
      if (ttl > 0) {
        await redis.setex(`${BLACKLIST_PREFIX}${accessToken}`, ttl, '1');
      }
    } catch {
      // Token already expired
    }
  }

  if (userId) {
    await AuditService.logEvent({
      actorId: userId,
      action: AuditAction.USER_LOGOUT,
      resourceType: 'User',
      resourceId: userId,
    });
  }
}

// ─── Revoke All Sessions ───────────────────────────────
export async function revokeAllSessions(userId: string) {
  const redis = getRedisClient();
  let cursor = '0';
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      'MATCH',
      `${REFRESH_TOKEN_PREFIX}*`,
      'COUNT',
      100,
    );
    cursor = nextCursor;

    for (const key of keys) {
      const val = await redis.get(key);
      if (val === userId) {
        await redis.del(key);
      }
    }
  } while (cursor !== '0');

  logger.info(`All sessions revoked for user: ${userId}`);
}

// ─── Check Token Blacklist ─────────────────────────────
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.get(`${BLACKLIST_PREFIX}${token}`);
  return result !== null;
}

// ─── Store Refresh Token ───────────────────────────────
async function storeRefreshToken(
  userId: string,
  refreshToken: string,
): Promise<void> {
  const redis = getRedisClient();
  const ttl = 7 * 24 * 60 * 60; // 7 days
  await redis.setex(`${REFRESH_TOKEN_PREFIX}${refreshToken}`, ttl, userId);
}
