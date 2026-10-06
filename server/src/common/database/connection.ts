import mongoose, { ClientSession } from 'mongoose';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let isReplicaSet = false;

export const connectDatabase = async (uri?: string): Promise<typeof mongoose> => {
  const connectionUri = uri || env.MONGODB_URI;
  try {
    const conn = await mongoose.connect(connectionUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Check if connected instance supports replica sets (transactions)
    try {
      if (conn.connection.db) {
        const adminDb = conn.connection.db.admin();
        const status = await adminDb.command({ replSetGetStatus: 1 });
        isReplicaSet = Boolean(status.ok);
        logger.info('MongoDB Replica Set detected: Multi-document ACID transactions enabled.');
      } else {
        isReplicaSet = false;
      }
    } catch {
      // Standalone mongod instance or permissions without replSetGetStatus
      isReplicaSet = false;
      logger.warn('MongoDB Replica Set not detected or status command failed. Transactions will use session if supported.');
    }

    return conn;
  } catch (error) {
    logger.error(error, 'MongoDB Connection Error');
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  }
};

export const isReplicaSetEnabled = (): boolean => isReplicaSet;

/**
 * Executes a function within an ACID MongoDB session transaction.
 */
export const runInTransaction = async <T>(
  work: (session: ClientSession) => Promise<T>
): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    let result: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result!;
  } finally {
    await session.endSession();
  }
};
