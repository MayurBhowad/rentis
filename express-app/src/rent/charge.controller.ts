import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Charge } from './Charge.model';
import type { ChargeType } from './Charge.model';

const CHARGE_TYPES: ChargeType[] = ['RENT', 'WATER', 'ELECTRICITY', 'OTHER'];

export async function list(req: Request, res: Response): Promise<void> {
  const tenantId = req.query.tenant_id as string | undefined;
  const status = req.query.status as string | undefined;
  const filter: Record<string, unknown> = {};
  if (tenantId && mongoose.Types.ObjectId.isValid(tenantId)) {
    filter.residentId = new mongoose.Types.ObjectId(tenantId);
  }
  if (status && ['PENDING', 'PARTIAL', 'PAID'].includes(status)) {
    filter.status = status;
  }
  const list = await Charge.find(filter).sort({ dueDate: 1 }).lean();
  res.json(list);
}

export async function create(req: Request, res: Response): Promise<void> {
  const { tenant_id, type, amount, period_from, period_to, due_date } = req.body as {
    tenant_id?: string;
    type?: string;
    amount?: number;
    period_from?: string;
    period_to?: string;
    due_date?: string;
  };
  if (!tenant_id || !mongoose.Types.ObjectId.isValid(tenant_id)) {
    res.status(400).json({ message: 'Valid tenant_id is required' });
    return;
  }
  if (!type || !CHARGE_TYPES.includes(type as ChargeType)) {
    res.status(400).json({ message: 'type must be one of RENT, WATER, ELECTRICITY, OTHER' });
    return;
  }
  const amt = Number(amount);
  if (Number.isNaN(amt) || amt < 0) {
    res.status(400).json({ message: 'amount must be a non-negative number' });
    return;
  }
  if (!period_from || !period_to) {
    res.status(400).json({ message: 'period_from and period_to are required' });
    return;
  }
  if (!due_date) {
    res.status(400).json({ message: 'due_date is required (ISO date)' });
    return;
  }
  const doc = await Charge.create({
    residentId: new mongoose.Types.ObjectId(tenant_id),
    type: type as ChargeType,
    amount: amt,
    periodFrom: period_from,
    periodTo: period_to,
    dueDate: new Date(due_date),
  });
  res.status(201).json(doc);
}
