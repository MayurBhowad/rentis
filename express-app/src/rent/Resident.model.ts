import mongoose, { Schema } from 'mongoose';

export interface IResident {
  _id: mongoose.Types.ObjectId;
  name: string;
  propertyId: mongoose.Types.ObjectId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const residentSchema = new Schema<IResident>(
  {
    name: { type: String, required: true, trim: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', default: null },
  },
  { timestamps: true }
);

residentSchema.index({ propertyId: 1 });

export const Resident = mongoose.model<IResident>('Resident', residentSchema);
