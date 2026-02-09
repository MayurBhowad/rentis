import mongoose, { Schema } from 'mongoose';

export type ChargeType = 'RENT' | 'WATER' | 'ELECTRICITY' | 'OTHER';
export type ChargeStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export interface ICharge {
  _id: mongoose.Types.ObjectId;
  residentId: mongoose.Types.ObjectId;
  type: ChargeType;
  amount: number;
  paidAmount: number;
  status: ChargeStatus;
  periodFrom: string; // YYYY-MM
  periodTo: string;
  dueDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const chargeSchema = new Schema<ICharge>(
  {
    residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
    type: {
      type: String,
      required: true,
      enum: ['RENT', 'WATER', 'ELECTRICITY', 'OTHER'],
    },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PAID'],
      default: 'PENDING',
    },
    periodFrom: { type: String, required: true },
    periodTo: { type: String, required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

chargeSchema.index({ residentId: 1, dueDate: 1 });

export const Charge = mongoose.model<ICharge>('Charge', chargeSchema);
