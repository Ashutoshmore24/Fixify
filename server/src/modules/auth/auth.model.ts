import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole =
  | 'STUDENT'
  | 'FACULTY'
  | 'LAB_ASSISTANT'
  | 'DEPT_AUTHORITY'
  | 'HOD'
  | 'ADMIN';

export type ApprovalStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firebaseUid?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  picture?: string;
  role: UserRole;
  department?: Types.ObjectId | null;
  assignedLabs: Types.ObjectId[];
  course?: string;
  year?: string;
  division?: string;
  prn?: string;
  employeeId?: string;
  profileComplete: boolean;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  lastLoginAt: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
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
    course: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: String,
      trim: true,
      default: '',
    },
    division: {
      type: String,
      trim: true,
      default: '',
    },
    prn: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
      default: '',
    },
    profileComplete: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['APPROVED', 'PENDING_APPROVAL', 'REJECTED'],
      default: 'APPROVED',
      index: true,
    },
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
