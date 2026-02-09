import mongoose, { Schema } from 'mongoose';

export interface IProperty {
  _id: mongoose.Types.ObjectId;
  name: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const propertySchema = new Schema<IProperty>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true }
);

propertySchema.index({ name: 1 });

export const Property = mongoose.model<IProperty>('Property', propertySchema);
