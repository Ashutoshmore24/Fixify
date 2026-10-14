import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { env } from '../config/env';
import { ForbiddenError } from '../errors/app-error';

export function isTrustedGateway(value: unknown): boolean {
  if (!env.EDGE_PROXY_SECRET) return true;
  if (typeof value !== 'string') return false;
  const supplied = Buffer.from(value);
  const expected = Buffer.from(env.EDGE_PROXY_SECRET);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function requireGateway(req: Request, _res: Response, next: NextFunction): void {
  // Render needs a public health check before Cloudflare is configured.
  if (req.path === '/health' || req.path === '/api/v1/health') return next();
  if (!isTrustedGateway(req.headers['x-fixify-gateway'])) {
    return next(new ForbiddenError('Use the public Fixify website to access this service.'));
  }
  next();
}
