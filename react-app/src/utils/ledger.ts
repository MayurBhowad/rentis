import type { Charge, Payment, Allocation, LedgerEntry } from '../types';

/** Sum of allocations for a charge. */
export function getChargeAllocated(chargeId: string, allocations: Allocation[]): number {
  return allocations
    .filter((a) => a.chargeId === chargeId)
    .reduce((sum, a) => sum + a.amount, 0);
}

/** Remaining balance on a charge. */
export function getChargeBalance(charge: Charge, allocations: Allocation[]): number {
  const allocated = getChargeAllocated(charge.id, allocations);
  return Math.max(0, charge.amount - allocated);
}

/** Allocate a new payment to charges (FIFO: oldest unpaid charge first). Returns new allocations. */
export function allocatePaymentFIFO(
  payment: Payment,
  charges: Charge[],
  existingAllocations: Allocation[]
): Allocation[] {
  const tenantCharges = charges
    .filter((c) => c.tenantId === payment.tenantId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt));

  const newAllocations: Allocation[] = [];
  let remaining = payment.amount;
  let nextId = Math.max(0, ...existingAllocations.map((a) => Number(a.id.replace(/\D/g, '')) || 0)) + 1;

  for (const charge of tenantCharges) {
    if (remaining <= 0) break;
    const allocated = getChargeAllocated(charge.id, existingAllocations);
    const chargeBalance = charge.amount - allocated;
    if (chargeBalance <= 0) continue;
    const apply = Math.min(remaining, chargeBalance);
    if (apply > 0) {
      newAllocations.push({
        id: `alloc-${nextId++}`,
        paymentId: payment.id,
        chargeId: charge.id,
        amount: apply,
      });
      remaining -= apply;
    }
  }

  return newAllocations;
}

/** Build ledger entries for a tenant: date-ordered rows with debit, credit, running balance. */
export function getLedgerEntries(
  tenantId: string,
  charges: Charge[],
  payments: Payment[],
  allocations: Allocation[]
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const tenantCharges = charges.filter((c) => c.tenantId === tenantId);
  const tenantPayments = payments.filter((p) => p.tenantId === tenantId);

  type Row = { date: string; type: 'CHARGE' | 'PAYMENT'; period: string; desc: string; debit: number; credit: number; chargeId?: string; paymentId?: string };
  const rows: Row[] = [];

  for (const c of tenantCharges) {
    const allocated = getChargeAllocated(c.id, allocations);
    rows.push({
      date: c.createdAt.slice(0, 10),
      type: 'CHARGE',
      period: c.period,
      desc: `${c.type} - ${c.period}`,
      debit: c.amount,
      credit: 0,
      chargeId: c.id,
    });
  }
  for (const p of tenantPayments) {
    rows.push({
      date: p.date,
      type: 'PAYMENT',
      period: '-',
      desc: 'Payment',
      debit: 0,
      credit: p.amount,
      paymentId: p.id,
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'CHARGE' ? -1 : 1));

  let balance = 0;
  for (const r of rows) {
    balance += r.debit - r.credit;
    entries.push({
      date: r.date,
      tenantId,
      type: r.type,
      period: r.period,
      description: r.desc,
      debit: r.debit,
      credit: r.credit,
      balance,
      chargeId: r.chargeId,
      paymentId: r.paymentId,
    });
  }
  return entries;
}

/** Total due = sum of (charge.amount - allocated) for all charges. */
export function getTotalDue(charges: Charge[], allocations: Allocation[]): number {
  return charges.reduce((sum, c) => sum + getChargeBalance(c, allocations), 0);
}

/** Total collected in a given month (payments with date in that month). */
export function getTotalCollectedInMonth(payments: Payment[], yearMonth: string): number {
  return payments
    .filter((p) => p.date.startsWith(yearMonth))
    .reduce((s, p) => s + p.amount, 0);
}

/** Tenant is overdue if they have any charge with dueDate < today and balance > 0. */
export function getOverdueTenantIds(charges: Charge[], allocations: Allocation[], today: string): Set<string> {
  const set = new Set<string>();
  for (const c of charges) {
    if (c.dueDate < today && getChargeBalance(c, allocations) > 0) set.add(c.tenantId);
  }
  return set;
}
