import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  hod?: Types.ObjectId | null;
  authorities: Types.ObjectId[];
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    hod: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    authorities: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

DepartmentSchema.pre(/^find/, function (this: mongoose.Query<unknown, IDepartment>, next) {
  const filter = this.getFilter();
  if (filter && filter.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
