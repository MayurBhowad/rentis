import mongoose, { Schema } from 'mongoose';

export interface IRole {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>('Role', roleSchema);
