import mongoose from 'mongoose';
import { Charge, type ICharge, type ChargeStatus } from './Charge.model';
import { Payment } from './Payment.model';
import { Allocation } from './Allocation.model';

function getChargeBalance(charge: ICharge): number {
  return Math.max(0, round2(charge.amount - charge.paidAmount));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function statusFromPaid(paid: number, amount: number): ChargeStatus {
  if (paid <= 0) return 'PENDING';
  if (round2(paid) >= round2(amount)) return 'PAID';
  return 'PARTIAL';
}

/**
 * Apply payment to oldest unpaid charges first (FIFO). Runs in a transaction.
 * Creates Allocation docs and updates Charge.paidAmount and Charge.status.
 */
export async function applyPaymentFIFO(
  paymentId: mongoose.Types.ObjectId,
  residentId: mongoose.Types.ObjectId,
  amount: number
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const charges = await Charge.find({ residentId })
      .sort({ dueDate: 1, createdAt: 1 })
      .session(session)
      .lean();

    let remaining = round2(amount);
    const allocations: { chargeId: mongoose.Types.ObjectId; amount: number }[] = [];

    for (const c of charges) {
      if (remaining <= 0) break;
      const balance = getChargeBalance(c);
      if (balance <= 0) continue;
      const apply = round2(Math.min(remaining, balance));
      if (apply > 0) {
        allocations.push({ chargeId: c._id, amount: apply });
        remaining -= apply;
      }
    }

    for (const { chargeId, amount: allocAmount } of allocations) {
      await Allocation.create(
        [{ paymentId, chargeId, amount: allocAmount }],
        { session }
      );
      const charge = await Charge.findById(chargeId).session(session);
      if (charge) {
        charge.paidAmount = round2(charge.paidAmount + allocAmount);
        charge.status = statusFromPaid(charge.paidAmount, charge.amount);
        await charge.save({ session });
      }
    }

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Reverse payment: delete allocations and decrement charge paidAmount/status.
 */
export async function reversePayment(paymentId: mongoose.Types.ObjectId): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const allocations = await Allocation.find({ paymentId }).session(session);
    for (const a of allocations) {
      const charge = await Charge.findById(a.chargeId).session(session);
      if (charge) {
        charge.paidAmount = round2(charge.paidAmount - a.amount);
        charge.status = statusFromPaid(charge.paidAmount, charge.amount);
        await charge.save({ session });
      }
    }
    await Allocation.deleteMany({ paymentId }).session(session);
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
