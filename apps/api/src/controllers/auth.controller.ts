import { Request, Response, NextFunction } from 'express';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from '../services/auth.service.js';
import { User } from '../models/User.js';
import { Citizen } from '../models/Citizen.js';
import { ApiError } from '../middleware/errorHandler.js';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

/**
 * POST /api/v1/auth/register
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, email, password, role, phone, dob, aadhaarNumber, panNumber } = req.body;

    const result = await registerUser(name, email, password, role, {
      phone,
      dob,
      aadhaarNumber,
      panNumber,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        citizen: result.citizen,
        accessToken: result.accessToken,
      },
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await loginUser(email, password, clientIp, userAgent);

    let citizen = null;
    if (result.user.role === 'CITIZEN') {
      citizen = await Citizen.findOne({ userId: result.user._id }).lean();
    }

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        citizen,
        accessToken: result.accessToken,
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/refresh
 */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const oldRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;

    if (!oldRefreshToken) {
      throw new ApiError(401, 'Refresh token required');
    }

    const result = await refreshAccessToken(oldRefreshToken);

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/logout
 */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;
    const accessToken = req.accessToken;

    await logoutUser(refreshToken, accessToken, req.user?.userId);

    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    let citizen = null;
    if (user.role === 'CITIZEN') {
      citizen = await Citizen.findOne({ userId: user._id }).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toSafeObject(),
        citizen,
      },
    });
  } catch (error) {
    next(error);
  }
}
