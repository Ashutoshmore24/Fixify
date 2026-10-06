import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { googleLoginSchema, devLoginSchema } from './auth.schema';
import { authenticate } from './auth.middleware';
import { NotFoundError } from '../../common/errors/app-error';

const router = Router();

router.post(
  '/google',
  validateRequest({ body: googleLoginSchema }),
  AuthController.googleLogin
);

// Dev-only impersonation login: only available when NODE_ENV === 'development' or 'test'
router.post(
  ['/dev-login', '/impersonate'],
  (req, res, next) => {
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
      return next(new NotFoundError('The requested endpoint was not found on this server'));
    }
    next();
  },
  validateRequest({ body: devLoginSchema }),
  AuthController.devLogin
);

router.post('/logout', authenticate, AuthController.logout);

router.get('/me', authenticate, AuthController.getMe);

export const authRoutes = router;
