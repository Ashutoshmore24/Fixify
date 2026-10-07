import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './common/config/env';
import { errorHandler } from './common/middleware/error-handler.middleware';
import { csrfProtection } from './common/middleware/csrf.middleware';
import { campusRateLimiter } from './common/middleware/rate-limit.middleware';
import { optionalAuth } from './modules/auth/auth.middleware';
import { authRoutes } from './modules/auth/auth.routes';
import { qrRoutes } from './modules/qr/qr.routes';
import { departmentRoutes } from './modules/departments/department.routes';
import { laboratoryRoutes } from './modules/laboratories/laboratory.routes';
import { computerRoutes } from './modules/computers/computer.routes';
import { userRoutes } from './modules/users/user.routes';
import { ticketRoutes } from './modules/tickets/ticket.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { sendSuccess } from './common/utils/api-response';
import { NotFoundError } from './common/errors/app-error';

export const createApp = (): Application => {
  const app = express();

  // 1. Security Headers - Allow popup communication for Google/Firebase Auth
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
  );

  // 2. Cross-Origin Resource Sharing (CORS) - Exact origin allowlist with dev localhost support
  const allowedOrigin = new URL(env.CLIENT_URL).origin;
  app.use(
    cors({
      origin: (requestOrigin, callback) => {
        if (!requestOrigin || requestOrigin === allowedOrigin) {
          callback(null, true);
        } else if (
          env.NODE_ENV !== 'production' &&
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)
        ) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked: Origin "${requestOrigin}" is not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        'X-Fixify-Client',
      ],
    })
  );

  // 3. Body & Cookie Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));

  // 4. Optional authentication to identify users for user-keyed rate limiting
  app.use(optionalAuth);

  // 5. Rate Limiting (Campus NAT friendly)
  app.use('/api', campusRateLimiter);

  // 6. CSRF Protection for state-changing requests
  app.use('/api', csrfProtection);

  // 7. Health Check
  app.get(['/health', '/api/v1/health'], (_req: Request, res: Response) => {
    sendSuccess(res, {
      status: 'healthy',
      app: 'Fixify API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  // 8. API v1 Modules
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/qr', qrRoutes);
  app.use('/api/v1/departments', departmentRoutes);
  app.use('/api/v1/laboratories', laboratoryRoutes);
  app.use('/api/v1/computers', computerRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/tickets', ticketRoutes);
  app.use('/api/v1/notifications', notificationRoutes);

  // 9. 404 Route Catch-all
  app.use((_req: Request, _res: Response, next) => {
    next(new NotFoundError('The requested endpoint was not found on this server'));
  });

  // 10. Central Error Handler
  app.use(errorHandler);

  return app;
};
