import { Router } from 'express';
import { DepartmentController } from './department.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', DepartmentController.getAll);
router.get('/:id', DepartmentController.getById);

export const departmentRoutes = router;
