import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '@/lib/jwt';
import { UnauthorizedError, ForbiddenError } from '@/utils/AppError';
import type { UserRole } from '@/types/common';

/**
 * Authenticates the request via Bearer access token.
 * Attaches `req.user` on success. Does not enforce roles.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

/**
 * Optional auth — populates `req.user` when a valid token is present; otherwise continues.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    next();
  }
}

/**
 * Role-based access control. Use after `authenticate`.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
