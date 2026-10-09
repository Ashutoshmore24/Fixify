import mongoose, { Schema, Document, Types } from 'mongoose';
import { nanoid } from 'nanoid';

export interface ILaboratory extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  labCode: string;
  building: string;
  department: Types.ObjectId;
  assistants: Types.ObjectId[];
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LaboratorySchema = new Schema<ILaboratory>(
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
    labCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
      default: () => nanoid(10),
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    assistants: [
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

LaboratorySchema.pre(/^find/, function (this: mongoose.Query<unknown, ILaboratory>, next) {
  const filter = this.getFilter();
  if (filter && filter.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Laboratory = mongoose.model<ILaboratory>('Laboratory', LaboratorySchema);
