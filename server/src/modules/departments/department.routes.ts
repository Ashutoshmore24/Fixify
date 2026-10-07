import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.get('/', DepartmentController.getAll);
router.use(authenticate);
router.get('/:id', DepartmentController.getById);

export const departmentRoutes = router;
