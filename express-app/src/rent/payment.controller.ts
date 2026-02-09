import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Payment } from './Payment.model';
import { Resident } from './Resident.model';
import { applyPaymentFIFO, reversePayment } from './payment.service';

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
    res.status(400).json({ message: 'Valid tenant_id is required' });
    return;
  }
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt < 0.01) {
    res.status(400).json({ message: 'amount must be a positive number' });
    return;
  }
  const residentId = new mongoose.Types.ObjectId(tenant_id);
  const resident = await Resident.findById(residentId);
  if (!resident) {
    res.status(400).json({ message: 'Tenant not found' });
    return;
  }
  const paymentDate = date ? new Date(date) : new Date();
  const doc = await Payment.create({
    residentId,
    amount: Math.round(amt * 100) / 100,
    date: paymentDate,
  });
  await applyPaymentFIFO(doc._id, residentId, doc.amount);
  res.status(201).json(doc);
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
  await reversePayment(payment._id);
  await Payment.findByIdAndDelete(id);
  res.status(204).send();
}
