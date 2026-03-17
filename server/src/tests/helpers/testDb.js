import 'dotenv/config';
import mongoose from 'mongoose';

const deriveTestUri = () => {
  if (process.env.MONGO_URI_TEST) return process.env.MONGO_URI_TEST;

  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI.replace(/\/[^/]+$/, '/hris_test');
  }

  return 'mongodb://localhost:27017/hris_test';
};

export const TEST_MONGO_URI = deriveTestUri();

export const connectToTestDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_MONGO_URI);
  }
};

export const dropTestCollections = async (collectionNames = []) => {
  for (const name of collectionNames) {
    const collection = mongoose.connection.collections[name];
    if (!collection) continue;

    try {
      await collection.drop();
    } catch (error) {
      if (error.codeName !== 'NamespaceNotFound') {
        throw error;
      }
    }
  }
};

export const disconnectTestDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};
