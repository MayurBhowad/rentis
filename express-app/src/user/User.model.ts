import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password_hash: string;
  username?: string;
  phone?: string;
  is_active: boolean;
  is_verified: boolean;
  role_id: mongoose.Types.ObjectId;
  tenant_id?: mongoose.Types.ObjectId;
  failed_login_attempts: number;
  locked_until?: Date;
  last_login_at?: Date;
  password_changed_at?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IUserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

type UserModel = Model<IUser, object, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    role_id: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    tenant_id: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: false,
      default: null,
    },
    failed_login_attempts: {
      type: Number,
      default: 0,
    },
    locked_until: {
      type: Date,
      default: null,
    },
    last_login_at: {
      type: Date,
      default: null,
    },
    password_changed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password_hash);
};

export const User = mongoose.model<IUser, UserModel>('User', userSchema);
