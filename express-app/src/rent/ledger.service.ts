import { Charge } from './Charge.model';
import { Payment } from './Payment.model';
import { Allocation } from './Allocation.model';
import type { Types } from 'mongoose';

export interface LedgerEntry {
  date: string;
  type: 'CHARGE' | 'PAYMENT';
  periodFrom?: string;
  periodTo?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  chargeId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  residentId: Types.ObjectId;
}

export interface LedgerFilters {
  residentId?: Types.ObjectId;
  propertyId?: Types.ObjectId;
  from?: string; // YYYY-MM-DD
  to?: string;
}

/**
 * Build ledger entries for one resident: charges and payments in date order with running balance.
 */
async function getLedgerForResident(
  residentId: Types.ObjectId,
  from?: string,
  to?: string
): Promise<LedgerEntry[]> {
  const charges = await Charge.find({ residentId }).sort({ dueDate: 1, createdAt: 1 }).lean();
  const payments = await Payment.find({ residentId }).sort({ date: 1 }).lean();
  const allocations = await Allocation.find({ chargeId: { $in: charges.map((c) => c._id) } }).lean();
  const byCharge = new Map<string, number>();
  for (const a of allocations) {
    const k = a.chargeId.toString();
    byCharge.set(k, (byCharge.get(k) ?? 0) + a.amount);
  }

  type Row = {
    date: string;
    type: 'CHARGE' | 'PAYMENT';
    periodFrom?: string;
    periodTo?: string;
    desc: string;
    debit: number;
    credit: number;
    chargeId?: Types.ObjectId;
    paymentId?: Types.ObjectId;
  };
  const rows: Row[] = [];
  for (const c of charges) {
    rows.push({
      date: (c.dueDate as Date).toISOString().slice(0, 10),
      type: 'CHARGE',
      periodFrom: c.periodFrom,
      periodTo: c.periodTo,
      desc: `${c.type} ${c.periodFrom}–${c.periodTo}`,
      debit: c.amount,
      credit: 0,
      chargeId: c._id,
    });
  }
  for (const p of payments) {
    rows.push({
      date: (p.date as Date).toISOString().slice(0, 10),
      type: 'PAYMENT',
      desc: 'Payment',
      debit: 0,
      credit: p.amount,
      paymentId: p._id,
    });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const entries: LedgerEntry[] = [];
  for (const r of rows) {
    balance += r.debit - r.credit;
    entries.push({
      date: r.date,
      residentId,
      type: r.type,
      periodFrom: r.periodFrom,
      periodTo: r.periodTo,
      description: r.desc,
      debit: r.debit,
      credit: r.credit,
      balance,
      chargeId: r.chargeId,
      paymentId: r.paymentId,
    });
  }
  return entries.filter((e) => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });
}

/**
 * GET /api/ledger with optional filters.
 */
export async function getLedger(filters: LedgerFilters): Promise<LedgerEntry[]> {
  const { residentId, propertyId, from, to } = filters;
  const { Resident } = await import('./Resident.model');
  let residentIds: Types.ObjectId[];
  if (residentId) {
    residentIds = [residentId];
  } else if (propertyId) {
    const list = await Resident.find({ propertyId }).select('_id').lean();
    residentIds = list.map((r) => r._id);
  } else {
    const list = await Resident.find({}).select('_id').lean();
    residentIds = list.map((r) => r._id);
  }
  const all: LedgerEntry[] = [];
  for (const rid of residentIds) {
    all.push(...(await getLedgerForResident(rid, from, to)));
  }
  all.sort((a, b) => a.date.localeCompare(b.date));
  return all;
}
