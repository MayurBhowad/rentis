import mongoose, { Schema } from 'mongoose';

export interface IPayment {
  _id: mongoose.Types.ObjectId;
  residentId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    residentId: { type: Schema.Types.ObjectId, ref: 'Resident', required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ residentId: 1, date: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
