import { Router } from 'express';
import { LaboratoryController } from './laboratory.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', LaboratoryController.getAll);
router.get('/by-code/:code', LaboratoryController.getByCode);
router.get('/:id', LaboratoryController.getById);

export const laboratoryRoutes = router;
