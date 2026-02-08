import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        email: string;
        password?: string;
        name?: string;
        createdAt?: Date;
        updatedAt?: Date;
      };
    }
  }
}

export {};
