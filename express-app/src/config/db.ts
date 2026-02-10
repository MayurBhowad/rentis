import mongoose from 'mongoose';
import { appLogger } from './logger';

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not defined in environment');
    }
    const conn = await mongoose.connect(uri);
    appLogger.info({
      msg: 'MongoDB connected',
      event: 'db_connected',
      host: conn.connection.host,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    appLogger.error({
      msg: 'MongoDB connection error',
      event: 'db_connection_failure',
      error: message,
    });
    process.exit(1);
  }
};
