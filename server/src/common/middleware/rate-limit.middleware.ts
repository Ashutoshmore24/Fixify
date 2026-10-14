import rateLimit from 'express-rate-limit';
import { Request } from 'express';
import { env } from '../config/env';
import { isIP } from 'net';

export const campusRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_UNAUTH_WINDOW_MS,
  max: (req: Request) => {
    // Authenticated users get higher quota; unauthenticated shared IP gets campus quota
    return req.user?.id ? env.RATE_LIMIT_AUTH_MAX : env.RATE_LIMIT_UNAUTH_MAX;
  },
  keyGenerator: (req: Request): string => {
    if (req.user?.id) {
      return `user_${req.user.id}`;
    }
    const clientIp = req.headers['x-fixify-client-ip'];
    if (env.EDGE_PROXY_SECRET && typeof clientIp === 'string' && isIP(clientIp)) return clientIp;
    return req.ip || 'ip_unknown';
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests generated. Please try again after a few minutes.',
    },
  },
});
