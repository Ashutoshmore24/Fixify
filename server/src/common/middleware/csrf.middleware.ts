import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/app-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const csrfProtection = (req: Request, _res: Response, next: NextFunction): void => {
  // Safe read-only HTTP methods are exempt from CSRF checks
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Exempt routes if specified (e.g., test or webhook)
  if (req.path.startsWith('/api/v1/auth/google/callback')) {
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
