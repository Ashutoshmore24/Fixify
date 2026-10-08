import { Router } from 'express';
import { ProfileController } from './profile.controller';
import { authenticate } from '../auth/auth.middleware';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { updateProfileSchema, deactivationRequestSchema } from './profile.schema';
import { avatarUploadMiddleware, bannerUploadMiddleware } from './profile.upload';

const router = Router();

// All profile endpoints require authentication
router.use(authenticate);

// 1. Full own profile
router.get('/me', ProfileController.getOwnProfile);

// 2. Update editable fields only
router.patch(
  '/me',
  validateRequest({ body: updateProfileSchema }),
  ProfileController.updateOwnProfile
);

// 3. Avatar upload and deletion
router.post('/me/avatar', ...avatarUploadMiddleware, ProfileController.uploadAvatar);
router.delete('/me/avatar', ProfileController.deleteAvatar);

// 4. Banner upload and deletion
router.post('/me/banner', ...bannerUploadMiddleware, ProfileController.uploadBanner);
router.delete('/me/banner', ProfileController.deleteBanner);

// 5. Account deactivation request
router.post(
  '/me/deactivation-request',
  validateRequest({ body: deactivationRequestSchema }),
  ProfileController.createDeactivationRequest
);

// 6. Public limited profile card (accessible to authenticated users)
router.get('/:id/public', ProfileController.getPublicProfile);

export const profileRoutes = router;
