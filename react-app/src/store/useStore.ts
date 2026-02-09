import { create } from 'zustand';
import type { Property, Tenant, Charge, Payment, Allocation, ChargeType } from '../types';
import { mockProperties, mockTenants, mockCharges, mockPayments, mockAllocations } from '../data/mockData';
import {
  getChargeBalance,
  allocatePaymentFIFO,
  getLedgerEntries,
  getTotalDue,
  getTotalCollectedInMonth,
  getOverdueTenantIds,
} from '../utils/ledger';

interface State {
  properties: Property[];
  tenants: Tenant[];
  charges: Charge[];
  payments: Payment[];
  allocations: Allocation[];
  addCharge: (tenantId: string, type: ChargeType, amount: number, period: string, dueDate: string) => void;
  addPayment: (tenantId: string, amount: number, date: string) => void;
  assignTenantToProperty: (tenantId: string, propertyId: string | null) => void;
  totalDue: () => number;
  totalCollectedThisMonth: () => number;
  overdueTenantCount: () => number;
  getLedgerForTenant: (tenantId: string) => import('../types').LedgerEntry[];
  getLedgerFiltered: (opts: { tenantId?: string; propertyId?: string; from?: string; to?: string }) => import('../types').LedgerEntry[];
  getMonthlyCollection: () => { month: string; total: number }[];
  getOutstandingDues: () => { tenantId: string; amount: number }[];
  getPropertyWiseIncome: () => { propertyId: string; total: number }[];
}

let chargeIdCounter = 1;
let paymentIdCounter = 1;

export const useStore = create<State>((set, get) => ({
  properties: mockProperties,
  tenants: mockTenants,
  charges: mockCharges,
  payments: mockPayments,
  allocations: mockAllocations,

  addCharge: (tenantId, type, amount, period, dueDate) => {
    const id = `c-new-${chargeIdCounter++}`;
    const charge: Charge = {
      id,
      tenantId,
      type,
      amount,
      period,
      dueDate,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ charges: [...s.charges, charge] }));
  },

  addPayment: (tenantId, amount, date) => {
    const id = `pm-new-${paymentIdCounter++}`;
    const payment: Payment = {
      id,
      tenantId,
      amount,
      date,
      createdAt: new Date().toISOString(),
    };
    set((s) => {
      const newAllocations = allocatePaymentFIFO(payment, [...s.charges], s.allocations);
      return {
        payments: [...s.payments, payment],
        allocations: [...s.allocations, ...newAllocations],
      };
    });
  },

  assignTenantToProperty: (tenantId, propertyId) => {
    set((s) => ({
      tenants: s.tenants.map((t) => (t.id === tenantId ? { ...t, propertyId } : t)),
    }));
  },

  totalDue: () => {
    const { charges, allocations } = get();
    return getTotalDue(charges, allocations);
  },

  totalCollectedThisMonth: () => {
    const { payments } = get();
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return getTotalCollectedInMonth(payments, ym);
  },

  overdueTenantCount: () => {
    const { charges, allocations } = get();
    const today = new Date().toISOString().slice(0, 10);
    return getOverdueTenantIds(charges, allocations, today).size;
  },

  getLedgerForTenant: (tenantId) => {
    const { charges, payments, allocations } = get();
    return getLedgerEntries(tenantId, charges, payments, allocations);
  },

  getLedgerFiltered: (opts) => {
    const { tenants, charges, payments, allocations } = get();
    const tenantIds = opts.tenantId
      ? [opts.tenantId]
      : opts.propertyId
        ? tenants.filter((t) => t.propertyId === opts.propertyId).map((t) => t.id)
        : tenants.map((t) => t.id);
    const allEntries: import('../types').LedgerEntry[] = [];
    for (const tid of tenantIds) {
      allEntries.push(...getLedgerEntries(tid, charges, payments, allocations));
    }
    let list = allEntries.sort((a, b) => a.date.localeCompare(b.date));
    if (opts.from) list = list.filter((e) => e.date >= opts.from!);
    if (opts.to) list = list.filter((e) => e.date <= opts.to!);
    return list;
  },

  getMonthlyCollection: () => {
    const { payments } = get();
    const byMonth = new Map<string, number>();
    for (const p of payments) {
      const ym = p.date.slice(0, 7);
      byMonth.set(ym, (byMonth.get(ym) ?? 0) + p.amount);
    }
    return Array.from(byMonth.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  },

  getOutstandingDues: () => {
    const { charges, allocations, tenants } = get();
    const byTenant = new Map<string, number>();
    for (const c of charges) {
      const bal = getChargeBalance(c, allocations);
      if (bal > 0) byTenant.set(c.tenantId, (byTenant.get(c.tenantId) ?? 0) + bal);
    }
    return Array.from(byTenant.entries()).map(([tenantId, amount]) => ({ tenantId, amount }));
  },

  getPropertyWiseIncome: () => {
    const { payments, tenants } = get();
    const byProp = new Map<string, number>();
    for (const p of payments) {
      const t = tenants.find((x) => x.id === p.tenantId);
      const pid = t?.propertyId ?? 'unassigned';
      byProp.set(pid, (byProp.get(pid) ?? 0) + p.amount);
    }
    return Array.from(byProp.entries()).map(([propertyId, total]) => ({ propertyId, total }));
  },
}));
