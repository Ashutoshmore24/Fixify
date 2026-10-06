import { Request, Response, NextFunction } from 'express';
import { AuthService, JwtTokenPayload } from './auth.service';
import { UnauthorizedError, ForbiddenError } from '../../common/errors/app-error';
import { UserRole } from './auth.model';
import { env } from '../../common/config/env';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtTokenPayload;
    }
  }
}

export const AUTH_COOKIE_NAME = 'fixify_token';

export const setAuthCookie = (res: Response, token: string): void => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15-minute sliding session
    path: '/',
  });
};

export const clearAuthCookie = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
};

export const extractToken = (req: Request): string | null => {
  // 1. From httpOnly cookie
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    return req.cookies[AUTH_COOKIE_NAME];
  }

  // 2. From Authorization header (fallback for API / programmatic clients)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Validates JWT, refreshes sliding cookie session, and injects req.user.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError('Authentication required: No token provided'));
  }

  try {
    const payload = AuthService.verifyToken(token);

    // Hard ceiling: verify session has not exceeded absolute max lifetime
    const maxSessionMs = env.SESSION_MAX_HOURS * 3600 * 1000;
    const elapsed = Date.now() - (payload.sessionStartedAt || Date.now());
    if (elapsed > maxSessionMs) {
      clearAuthCookie(res);
      return next(
        new UnauthorizedError(
          'Session reached maximum absolute duration. Please sign in again.',
          'MAX_SESSION_EXPIRED'
        )
      );
    }

    req.user = payload;

    // Refresh sliding session cookie with refreshed token keeping original sessionStartedAt
    const refreshedToken = AuthService.generateTokenFromPayload(payload);
    setAuthCookie(res, refreshedToken);

    next();
  } catch (error) {
    clearAuthCookie(res);
    next(error);
  }
};

/**
 * Enforces Role-Based Access Control (RBAC).
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Role "${req.user.role}" does not have required permissions. Required: [${allowedRoles.join(', ')}]`
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication: Populates req.user if a valid token exists, without rejecting unauthenticated requests.
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = AuthService.verifyToken(token);
    req.user = payload;
  } catch {
    clearAuthCookie(res);
  }

  next();
};
