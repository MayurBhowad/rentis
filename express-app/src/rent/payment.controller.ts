import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Payment } from './Payment.model';
import { Resident } from './Resident.model';
import { applyPaymentFIFO, reversePayment } from './payment.service';
import { paymentsLogger } from '../config/logger';

const log = paymentsLogger;

export async function list(req: Request, res: Response): Promise<void> {
  const tenantId = req.query.tenant_id as string | undefined;
  const filter: Record<string, unknown> = {};
  if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
    filter.residentId = new mongoose.Types.ObjectId(tenantId);
  }
  const list = await Payment.find(filter).sort({ date: -1 }).lean();
  res.json(list);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { tenant_id, amount, date } = req.body as {
    tenant_id?: string;
    amount?: number;
    date?: string;
  };
  if (!tenant_id || !mongoose.Types.ObjectId.isValid(tenant_id)) {
    log.warn({
      msg: 'Payment validation error',
      event: 'payment_validation_error',
      reason: 'invalid_tenant_id',
      tenantId: tenant_id ?? 'missing',
    });
    res.status(400).json({ message: 'Valid tenant_id is required' });
    return;
  }
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt < 0.01) {
    log.warn({
      msg: 'Payment validation error',
      event: 'payment_validation_error',
      reason: 'invalid_amount',
      tenantId: tenant_id,
    });
    res.status(400).json({ message: 'amount must be a positive number' });
    return;
  }
  const residentId = new mongoose.Types.ObjectId(tenant_id);
  const resident = await Resident.findById(residentId);
  if (!resident) {
    log.warn({
      msg: 'Payment validation error',
      event: 'payment_validation_error',
      reason: 'tenant_not_found',
      tenantId: tenant_id,
    });
    res.status(400).json({ message: 'Tenant not found' });
    return;
  }
  const paymentDate = date ? new Date(date) : new Date();
  const amountRounded = Math.round(amt * 100) / 100;

  try {
    const doc = await Payment.create({
      residentId,
      amount: amountRounded,
      date: paymentDate,
    });

    const { chargesAffected, advanceAmount } = await applyPaymentFIFO(doc._id, residentId, doc.amount);

    log.info({
      msg: 'Payment created',
      event: 'payment_created',
      paymentId: doc._id.toString(),
      tenantId: tenant_id,
      amount: doc.amount,
      chargesAffected,
      advanceAmount: advanceAmount > 0 ? advanceAmount : undefined,
      success: true,
    });

    res.status(201).json(doc);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error({
      msg: 'Payment creation failed',
      event: 'payment_created_failure',
      tenantId: tenant_id,
      amount: amountRounded,
      success: false,
      error: message,
    });
    res.status(500).json({ message: 'Payment could not be created' });
  }
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }
  const payment = await Payment.findById(id);
  if (!payment) {
    res.status(404).json({ message: 'Payment not found' });
    return;
  }
  try {
    await reversePayment(payment._id);
    await Payment.findByIdAndDelete(id);
    log.info({
      msg: 'Payment deleted',
      event: 'payment_deleted',
      paymentId: id,
      tenantId: payment.residentId.toString(),
      amount: payment.amount,
      success: true,
    });
    res.status(204).send();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    log.error({
      msg: 'Payment deletion failed',
      event: 'payment_deleted_failure',
      paymentId: id,
      success: false,
      error: message,
    });
    res.status(500).json({ message: 'Payment could not be deleted' });
  }
}
