import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { sendSuccess } from '../../common/utils/api-response';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const notifications = await NotificationService.getUserNotifications(req.user!.id);
      sendSuccess(res, notifications);
    } catch (error) {
      next(error);
    }
  }

  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await NotificationService.markAsRead(req.params.id as string, req.user!.id);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await NotificationService.markAllAsRead(req.user!.id);
      sendSuccess(res, null);
    } catch (error) {
      next(error);
    }
  }
}
