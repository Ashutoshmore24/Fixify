import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  INACTIVE_STATUSES,
} from './ticket.constants';

export interface ITicketTimelineEntry {
  status: TicketStatus;
  actor: {
    id: Types.ObjectId;
    name: string;
    role: string;
  };
  timestamp: Date;
  note?: string;
}

export interface ITicket extends Document {
  _id: Types.ObjectId;
  ticketId: string;
  computer: Types.ObjectId;
  lab: Types.ObjectId;
  department: Types.ObjectId;
  reportedBy: Types.ObjectId;
  assignedTo?: Types.ObjectId | null;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  images: string[];
  status: TicketStatus;
  isActive: boolean;
  timeline: ITicketTimelineEntry[];
  resolutionNotes?: string | null;
  testedOk?: boolean | null;
  closedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TicketTimelineSchema = new Schema<ITicketTimelineEntry>(
  {
    status: {
      type: String,
      required: true,
    },
    actor: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    computer: {
      type: Schema.Types.ObjectId,
      ref: 'Computer',
      required: true,
      index: true,
    },
    lab: {
      type: Schema.Types.ObjectId,
      ref: 'Laboratory',
      required: true,
      index: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    category: {
      type: String,
      enum: ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ELECTRICAL', 'OTHER'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: [
        'OPEN',
        'ASSIGNED',
        'ACCEPTED',
        'IN_PROGRESS',
        'ESCALATED',
        'AWAITING_PARTS',
        'RESOLVED',
        'CLOSED',
        'REJECTED',
        'CANCELLED',
      ],
      default: 'OPEN',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    timeline: [TicketTimelineSchema],
    resolutionNotes: {
      type: String,
      default: null,
    },
    testedOk: {
      type: Boolean,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
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

// BR-3: Partial Unique Index - No second active ticket for the same computer
TicketSchema.index(
  { computer: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: 'unique_active_ticket_per_computer',
  }
);

// Performance compound indexes
TicketSchema.index({ status: 1, lab: 1, createdAt: -1 });
TicketSchema.index({ reportedBy: 1, createdAt: -1 });
TicketSchema.index({ assignedTo: 1, isActive: 1 });

// Ensure isActive is strictly in sync before save
TicketSchema.pre('save', function (next) {
  this.isActive = !INACTIVE_STATUSES.includes(this.status) && !this.deletedAt;
  next();
});

// Exclude soft-deleted tickets by default
TicketSchema.pre(/^find/, function (this: mongoose.Query<unknown, ITicket>, next) {
  const filter = this.getFilter();
  if (filter && filter.deletedAt === undefined) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Ticket = mongoose.model<ITicket>('Ticket', TicketSchema);
