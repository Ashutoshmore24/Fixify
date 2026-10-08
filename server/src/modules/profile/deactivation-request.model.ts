import mongoose, { Schema, Document, Types } from 'mongoose';

export type DeactivationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IDeactivationRequest extends Document {
  user: Types.ObjectId;
  reason: string;
  status: DeactivationStatus;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeactivationRequestSchema = new Schema<IDeactivationRequest>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const DeactivationRequest = mongoose.model<IDeactivationRequest>(
  'DeactivationRequest',
  DeactivationRequestSchema
);
