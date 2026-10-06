import { Router } from 'express';
import { ComputerController } from './computer.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', ComputerController.getByLab);
router.get('/:id', ComputerController.getById);

export const computerRoutes = router;
