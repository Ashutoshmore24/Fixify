import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  actor?: Types.ObjectId | null;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId | string | null;
  before?: unknown;
  after?: unknown;
  ip?: string;
  at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true,
    },
    before: {
      type: Schema.Types.Mixed,
      default: null,
    },
    after: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// BR-9 Invariant: Enforce append-only nature at Mongoose middleware layer
const rejectMutation = function (this: unknown, next: (err?: Error) => void) {
  next(new Error('BR-9 Violation: AuditLog records are append-only and cannot be modified or deleted.'));
};

AuditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(
      new Error('BR-9 Violation: AuditLog records are append-only and existing records cannot be modified.')
    );
  }
  next();
});

AuditLogSchema.pre('updateOne', rejectMutation);
AuditLogSchema.pre('updateMany', rejectMutation);
AuditLogSchema.pre('findOneAndUpdate', rejectMutation);
AuditLogSchema.pre('replaceOne', rejectMutation);
AuditLogSchema.pre('findOneAndReplace', rejectMutation);
AuditLogSchema.pre('deleteOne', rejectMutation);
AuditLogSchema.pre('deleteMany', rejectMutation);
AuditLogSchema.pre('findOneAndDelete', rejectMutation);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
