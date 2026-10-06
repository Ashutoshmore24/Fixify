import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole =
  | 'STUDENT'
  | 'FACULTY'
  | 'LAB_ASSISTANT'
  | 'DEPT_AUTHORITY'
  | 'HOD'
  | 'ADMIN';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  picture?: string;
  role: UserRole;
  department?: Types.ObjectId | null;
  assignedLabs: Types.ObjectId[];
  isActive: boolean;
  lastLoginAt: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    picture: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'LAB_ASSISTANT', 'DEPT_AUTHORITY', 'HOD', 'ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    assignedLabs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Laboratory',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Query middleware to exclude soft-deleted users by default
UserSchema.pre(/^find/, function (this: mongoose.Query<unknown, IUser>, next) {
  const filter = this.getFilter();
  if (filter && filter.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);
