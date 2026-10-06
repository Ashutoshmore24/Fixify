import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', NotificationController.getNotifications);
router.patch('/read-all', NotificationController.markAllRead);
router.patch('/:id/read', NotificationController.markRead);

export const notificationRoutes = router;
