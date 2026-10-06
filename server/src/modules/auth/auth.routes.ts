import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { googleLoginSchema, devLoginSchema } from './auth.schema';
import { authenticate } from './auth.middleware';

const router = Router();

router.post(
  '/google',
  validateRequest({ body: googleLoginSchema }),
  AuthController.googleLogin
);

// Dev-only impersonation login: only available when NODE_ENV === 'development' or 'test'
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  router.post(
    '/dev-login',
    validateRequest({ body: devLoginSchema }),
    AuthController.devLogin
  );
  router.post(
    '/impersonate',
    validateRequest({ body: devLoginSchema }),
    AuthController.devLogin
  );
} else {
  router.post(['/dev-login', '/impersonate'], (_req, _res, next) => {
    next(new NotFoundError('The requested endpoint was not found on this server'));
  });
}

router.post('/logout', authenticate, AuthController.logout);

router.get('/me', authenticate, AuthController.getMe);

export const authRoutes = router;
