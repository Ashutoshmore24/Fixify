import mongoose, { Schema, Document, ClientSession } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);

/**
 * Atomically increments and returns the next sequence number for a given counter key.
 */
export const getNextSequence = async (
  key: string,
  session?: ClientSession
): Promise<number> => {
  const options = {
    new: true,
    upsert: true,
    ...(session ? { session } : {}),
  };

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    options
  );

  if (!counter) {
    throw new Error(`Failed to generate sequence for counter key: ${key}`);
  }

  return counter.seq;
};

/**
 * Generates an annual ticket ID in the format FIX-YYYY-000001
 * Uses annual key: ticket-YYYY
 */
export const generateTicketId = async (
  year = new Date().getFullYear(),
  session?: ClientSession
): Promise<string> => {
  const counterKey = `ticket-${year}`;
  const seq = await getNextSequence(counterKey, session);
  const padded = String(seq).padStart(6, '0');
  return `FIX-${year}-${padded}`;
};
