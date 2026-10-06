import { Types } from 'mongoose';
import { Notification, INotification, NotificationType } from './notification.model';
import { emitToUser } from '../../common/socket/socket.server';

export interface CreateNotificationParams {
  userId: Types.ObjectId | string;
  title: string;
  message: string;
  type?: NotificationType;
  ticketId?: string;
}

export class NotificationService {
  static async create(params: CreateNotificationParams): Promise<INotification> {
    const notification = await Notification.create({
      user: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || 'INFO',
      ticketId: params.ticketId || null,
      read: false,
    });

    // Push real-time socket notification to the specific user
    emitToUser(params.userId.toString(), 'notification:new', notification);

    return notification;
  }

  static async getUserNotifications(userId: string): Promise<INotification[]> {
    return Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(30);
  }

  static async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { read: true } },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );
  }
}
