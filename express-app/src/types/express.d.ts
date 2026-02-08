import type { Types } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: Types.ObjectId;
        email: string;
        username?: string;
        phone?: string;
        is_active: boolean;
        is_verified: boolean;
        role_id: Types.ObjectId;
        tenant_id: Types.ObjectId;
        failed_login_attempts: number;
        locked_until?: Date;
        last_login_at?: Date;
        password_changed_at?: Date;
        createdAt?: Date;
        updatedAt?: Date;
      };
    }
  }
}

export {};
