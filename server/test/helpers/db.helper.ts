import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/common/database/connection';

let replSet: MongoMemoryReplSet | null = null;

export const startTestDb = async (): Promise<string> => {
  if (replSet) {
    return replSet.getUri();
  }

  // Initialize in replica set mode so multi-document transactions work in tests
  replSet = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
    },
  });

  const uri = replSet.getUri();
  await connectDatabase(uri);
  return uri;
};

export const clearTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      // Clear all documents (use native deleteMany to bypass Mongoose append-only pre-hook for AuditLog in test cleanup)
      await collection.deleteMany({});
    }
  }
};

export const stopTestDb = async (): Promise<void> => {
  await disconnectDatabase();
  if (replSet) {
    await replSet.stop();
    replSet = null;
  }
};
