import mongoose, { Schema } from 'mongoose';

/** Links a payment to a charge: how much of the payment was applied to this charge (FIFO). */
export interface IAllocation {
  _id: mongoose.Types.ObjectId;
  paymentId: mongoose.Types.ObjectId;
  chargeId: mongoose.Types.ObjectId;
  amount: number;
  createdAt?: Date;
}

const allocationSchema = new Schema<IAllocation>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    chargeId: { type: Schema.Types.ObjectId, ref: 'Charge', required: true },
    amount: { type: Number, required: true, min: 0.01 },
  },
  { timestamps: true }
);

allocationSchema.index({ paymentId: 1 });
allocationSchema.index({ chargeId: 1 });

export const Allocation = mongoose.model<IAllocation>('Allocation', allocationSchema);
