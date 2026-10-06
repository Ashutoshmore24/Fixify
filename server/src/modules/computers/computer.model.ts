import mongoose, { Schema, Document, Types } from 'mongoose';

export type ComputerStatus = 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED';

export interface IComputer extends Document {
  _id: Types.ObjectId;
  assetTag: string;
  lab: Types.ObjectId;
  label: string;
  processor: string;
  ram: string;
  storage: string;
  status: ComputerStatus;
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ComputerSchema = new Schema<IComputer>(
  {
    assetTag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    lab: {
      type: Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    processor: {
      type: String,
      default: 'Intel Core i5',
    },
    ram: {
      type: String,
      default: '8 GB DDR4',
    },
    storage: {
      type: String,
      default: '256 GB SSD',
    },
    status: {
      type: String,
      enum: ['OPERATIONAL', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'],
      default: 'OPERATIONAL',
      index: true,
    },
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

ComputerSchema.pre(/^find/, function (this: mongoose.Query<unknown, IComputer>, next) {
  const filter = this.getFilter();
  if (filter && filter.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Computer = mongoose.model<IComputer>('Computer', ComputerSchema);
