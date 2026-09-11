import { Request, Response, NextFunction } from 'express';
import { UserRole, ROLE_HIERARCHY } from '@govconnect/shared-types';
import { ApiError } from './errorHandler.js';
import { Application } from '../models/Application.js';
import { Citizen } from '../models/Citizen.js';
import { User } from '../models/User.js';

// Extend Express Request to include user and attached entities
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        name: string;
      };
      accessToken?: string;
      application?: any;
    }
  }
}

/**
 * Require specific role(s) — exact match against allowed list
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
        ),
      );
    }

    next();
  };
}

/**
 * Require minimum role level in the hierarchy
 */
export function minRole(minimumRole: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 999;

    if (userLevel < requiredLevel) {
      return next(
        new ApiError(
          403,
          `Insufficient permissions. Requires minimum role: ${minimumRole}`,
        ),
      );
    }

    next();
  };
}

/**
 * BOLA / IDOR Defense: Require Application Access
 */
export async function requireApplicationAccess(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', true, undefined, 'AUTH_REQUIRED'));
    }

    const appIdOrRef = (req.params.id || req.params.applicationId) as string | undefined;
    if (!appIdOrRef) {
      return next(new ApiError(400, 'Application ID parameter required'));
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(appIdOrRef);
    const query = isObjectId ? { _id: appIdOrRef } : { applicationId: appIdOrRef };
    
    const application = await Application.findOne(query)
      .populate('citizenId')
      .populate('departmentId');

    if (!application) {
      return next(new ApiError(404, 'Application not found', true, undefined, 'APPLICATION_NOT_FOUND'));
    }

    (req as any).application = application;

    const userRole = req.user.role as UserRole;

    if ([UserRole.PLATFORM_ADMIN, UserRole.SUPER_ADMIN].includes(userRole)) {
      return next();
    }

    if (userRole === UserRole.CITIZEN) {
      const citizenDoc = await Citizen.findOne({ userId: req.user.userId });
      const appCitizenId = application.citizenId?._id || application.citizenId;
      if (!citizenDoc || String(appCitizenId) !== String(citizenDoc._id)) {
        return next(
          new ApiError(
            403,
            'Forbidden: You do not have permission to access another citizen’s application.',
            true,
            undefined,
            'BOLA_VIOLATION',
          ),
        );
      }
      return next();
    }

    if ([UserRole.DEPT_OFFICER, UserRole.DEPT_ADMIN].includes(userRole)) {
      const user = await User.findById(req.user.userId);
      const appDeptId = String(application.departmentId?._id || application.departmentId);
      const userDeptId = user?.department ? String(user.department) : null;

      if (!userDeptId || appDeptId !== userDeptId) {
        return next(
          new ApiError(
            403,
            'Forbidden: You do not have jurisdiction over applications outside your assigned department.',
            true,
            undefined,
            'DEPARTMENT_JURISDICTION_VIOLATION',
          ),
        );
      }
      return next();
    }

    return next(new ApiError(403, 'Access denied'));
  } catch (error) {
    next(error);
  }
}

/**
 * Self-or-Admin: Allow access if the user is accessing their own resource or is an admin
 */
export function selfOrAdmin(paramName: string = 'userId') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const targetUserId = req.params[paramName];
    const isSelf = req.user.userId === targetUserId;
    const isAdmin = [
      UserRole.DEPT_ADMIN,
      UserRole.PLATFORM_ADMIN,
      UserRole.SUPER_ADMIN,
    ].includes(req.user.role);

    if (!isSelf && !isAdmin) {
      return next(
        new ApiError(403, 'Access denied: can only access your own resources'),
      );
    }

    next();
  };
}
