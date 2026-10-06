import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { updateRoleSchema } from './user.schema';

const router = Router();

router.use(authenticate);

// Listing users (Admins, Authorities, HODs, or assistants)
router.get('/', requireRole(['ADMIN', 'DEPT_AUTHORITY', 'HOD', 'LAB_ASSISTANT']), UserController.getUsers);

// Role assignment: strictly ADMIN only
router.patch(
  '/:id/role',
  requireRole(['ADMIN']),
  validateRequest({ body: updateRoleSchema }),
  UserController.updateRole
);

export const userRoutes = router;
