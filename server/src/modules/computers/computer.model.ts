import mongoose, { Schema, Document, Types } from 'mongoose';

export type ComputerStatus =
  | 'ACTIVE'
  | 'UNDER_MAINTENANCE'
  | 'RETIRED'
  | 'OPERATIONAL'
  | 'DECOMMISSIONED';

export interface InstalledComponent {
  type?: string;
  name?: string;
  serialNumber?: string;
  installedAt?: Date;
}

export interface IComputer extends Document {
  _id: Types.ObjectId;
  assetTag: string;
  lab: Types.ObjectId;
  label: string;
  processor: string;
  ram: string;
  storage: string;
  purchaseDate?: Date | null;
  warrantyExpiry?: Date | null;
  vendor?: string;
  status: ComputerStatus;
  notes?: string;
  installedComponents: InstalledComponent[];
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
    purchaseDate: {
      type: Date,
      default: null,
    },
    warrantyExpiry: {
      type: Date,
      default: null,
      index: true,
    },
    vendor: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'UNDER_MAINTENANCE', 'RETIRED', 'OPERATIONAL', 'DECOMMISSIONED'],
      default: 'ACTIVE',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    installedComponents: [
      {
        type: { type: String, default: '' },
        name: { type: String, default: '' },
        serialNumber: { type: String, default: '' },
        installedAt: { type: Date, default: Date.now },
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

ComputerSchema.pre(/^find/, function (this: mongoose.Query<unknown, IComputer>, next) {
  const filter = this.getFilter();
  if (filter && filter.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Computer = mongoose.model<IComputer>('Computer', ComputerSchema);
