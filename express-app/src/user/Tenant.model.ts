import mongoose, { Schema } from 'mongoose';

export interface ITenant {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const tenantSchema = new Schema<ITenant>(
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

export const Tenant = mongoose.model<ITenant>('Tenant', tenantSchema);
