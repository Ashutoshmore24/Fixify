import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType = 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';

export interface INotification extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  ticketId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['INFO', 'WARNING', 'ALERT', 'SUCCESS'],
      default: 'INFO',
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    ticketId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
