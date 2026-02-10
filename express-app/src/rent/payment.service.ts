import mongoose from 'mongoose';
import { Charge, type ICharge, type ChargeStatus } from './Charge.model';
import { Allocation } from './Allocation.model';
import { paymentsLogger } from '../config/logger';

const log = paymentsLogger;

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

export interface ApplyPaymentResult {
  chargesAffected: number;
  advanceAmount: number;
}

/**
 * Apply payment to oldest unpaid charges first (FIFO). Runs in a transaction.
 * Creates Allocation docs and updates Charge.paidAmount and Charge.status.
 * Logs every payment application and charge adjustment for audit.
 */
export async function applyPaymentFIFO(
  paymentId: mongoose.Types.ObjectId,
  residentId: mongoose.Types.ObjectId,
  amount: number
): Promise<ApplyPaymentResult> {
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

    const advanceAmount = round2(remaining);

    for (const { chargeId, amount: allocAmount } of allocations) {
      const charge = await Charge.findById(chargeId).session(session);
      if (charge) {
        const beforePaid = charge.paidAmount;
        const afterPaid = round2(charge.paidAmount + allocAmount);
        const beforeStatus = charge.status;
        charge.paidAmount = afterPaid;
        charge.status = statusFromPaid(charge.paidAmount, charge.amount);

        await Allocation.create(
          [{ paymentId, chargeId, amount: allocAmount }],
          { session }
        );
        await charge.save({ session });

        log.info({
          msg: 'Charge adjustment',
          event: 'charge_adjustment',
          paymentId: paymentId.toString(),
          chargeId: chargeId.toString(),
          residentId: residentId.toString(),
          beforePaidAmount: beforePaid,
          afterPaidAmount: afterPaid,
          statusChange: `${beforeStatus} -> ${charge.status}`,
          appliedAmount: allocAmount,
        });
      }
    }

    await session.commitTransaction();

    log.info({
      msg: 'Payment applied',
      event: 'payment_applied',
      paymentId: paymentId.toString(),
      residentId: residentId.toString(),
      amount,
      chargesAffected: allocations.length,
      advanceAmount: advanceAmount > 0 ? advanceAmount : undefined,
      success: true,
    });

    return { chargesAffected: allocations.length, advanceAmount };
  } catch (err) {
    await session.abortTransaction();
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error({
      msg: 'Payment application failed',
      event: 'payment_apply_failure',
      paymentId: paymentId.toString(),
      residentId: residentId.toString(),
      amount,
      success: false,
      error: message,
    });
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Reverse payment: delete allocations and decrement charge paidAmount/status.
 * Logs each charge adjustment and transaction failure for audit.
 */
export async function reversePayment(paymentId: mongoose.Types.ObjectId): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const allocations = await Allocation.find({ paymentId }).session(session);
    for (const a of allocations) {
      const charge = await Charge.findById(a.chargeId).session(session);
      if (charge) {
        const beforePaid = charge.paidAmount;
        charge.paidAmount = round2(charge.paidAmount - a.amount);
        charge.status = statusFromPaid(charge.paidAmount, charge.amount);
        await charge.save({ session });

        log.info({
          msg: 'Charge adjustment (reversal)',
          event: 'charge_adjustment_reversal',
          paymentId: paymentId.toString(),
          chargeId: charge._id.toString(),
          beforePaidAmount: beforePaid,
          afterPaidAmount: charge.paidAmount,
          statusChange: charge.status,
          reversedAmount: a.amount,
        });
      }
    }
    await Allocation.deleteMany({ paymentId }).session(session);
    await session.commitTransaction();

    log.info({
      msg: 'Payment reversed',
      event: 'payment_reversed',
      paymentId: paymentId.toString(),
      chargesAffected: allocations.length,
      success: true,
    });
  } catch (err) {
    await session.abortTransaction();
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error({
      msg: 'Payment reversal failed',
      event: 'payment_reversal_failure',
      paymentId: paymentId.toString(),
      success: false,
      error: message,
    });
    throw err;
  } finally {
    session.endSession();
  }
}
