import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/app-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  // Safe read-only HTTP methods are exempt from CSRF checks
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Exempt auth session endpoints — they accept a Firebase ID token in the body
  // (not cookie-based), so there is no CSRF risk. The dev-login route is also
  // exempted since it only runs in non-production environments.
  if (
    req.path.startsWith('/api/v1/auth/session') ||
    req.path.startsWith('/api/v1/auth/google') ||
    req.path.startsWith('/api/v1/auth/dev-login') ||
    req.path.startsWith('/api/v1/auth/impersonate')
  ) {
    return next();
  }

  // Custom header check for same-site single-page applications
  // Cross-origin form posts and fetch cannot send custom headers without preflight approval
  const customHeader =
    req.headers['x-requested-with'] ||
    req.headers['x-csrf-token'] ||
    req.headers['x-fixify-client'];

  if (!customHeader) {
    return next(
      new ForbiddenError(
        'CSRF validation failed: Missing required verification header (e.g. X-Requested-With or X-CSRF-Token)',
        'CSRF_VALIDATION_FAILED'
      )
    );
  }

  next();
};
