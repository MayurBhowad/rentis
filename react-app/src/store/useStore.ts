import { create } from 'zustand';
import type { Property, Tenant, Charge, Payment, ChargeType } from '../types';
import { api, mapProperty, mapTenant, mapCharge, mapPayment, type ApiReportSummary } from '../api/client';

interface ReportSummaryState {
  monthlyCollection: { month: string; total: number }[];
  outstandingDues: { tenantId: string; amount: number }[];
  propertyWiseIncome: { propertyId: string; total: number }[];
}

interface State {
  properties: Property[];
  tenants: Tenant[];
  charges: Charge[];
  payments: Payment[];
  reportSummary: ReportSummaryState | null;
  loading: boolean;
  error: string | null;
  loadAll: () => Promise<void>;
  setError: (msg: string | null) => void;
  addCharge: (tenantId: string, type: ChargeType, amount: number, period: string, dueDate: string) => Promise<void>;
  addPayment: (tenantId: string, amount: number, date: string) => Promise<void>;
  assignTenantToProperty: (tenantId: string, propertyId: string | null) => Promise<void>;
  totalDue: () => number;
  totalCollectedThisMonth: () => number;
  overdueTenantCount: () => number;
  getMonthlyCollection: () => { month: string; total: number }[];
  getOutstandingDues: () => { tenantId: string; amount: number }[];
  getPropertyWiseIncome: () => { propertyId: string; total: number }[];
}

function normalizeReport(r: ApiReportSummary | null): ReportSummaryState {
  if (!r) return { monthlyCollection: [], outstandingDues: [], propertyWiseIncome: [] };
  return {
    monthlyCollection: r.monthlyCollection ?? [],
    outstandingDues: (r.outstandingDues ?? []).map((d) => ({ tenantId: d.residentId, amount: d.amount })),
    propertyWiseIncome: r.propertyWiseIncome ?? [],
  };
}

export const useStore = create<State>((set, get) => ({
  properties: [],
  tenants: [],
  charges: [],
  payments: [],
  reportSummary: null,
  loading: false,
  error: null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const [properties, tenants, charges, payments, reportSummary] = await Promise.all([
        api.getProperties(),
        api.getTenants(),
        api.getCharges(),
        api.getPayments(),
        api.getReportSummary(),
      ]);
      set({
        properties: properties.map(mapProperty),
        tenants: tenants.map(mapTenant),
        charges: charges.map(mapCharge),
        payments: payments.map(mapPayment),
        reportSummary: normalizeReport(reportSummary),
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      set({ loading: false, error: message });
    }
  },

  setError: (msg) => set({ error: msg }),

  addCharge: async (tenantId, type, amount, period, dueDate) => {
    set({ error: null });
    try {
      await api.postCharge({
        tenant_id: tenantId,
        type,
        amount,
        period_from: period,
        period_to: period,
        due_date: `${dueDate}T00:00:00.000Z`,
      });
      const [charges, reportSummary] = await Promise.all([api.getCharges(), api.getReportSummary()]);
      set((s) => ({
        charges: charges.map(mapCharge),
        reportSummary: normalizeReport(reportSummary),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add charge';
      set({ error: message });
      throw err;
    }
  },

  addPayment: async (tenantId, amount, date) => {
    set({ error: null });
    try {
      await api.postPayment({ tenant_id: tenantId, amount, date });
      const [payments, charges, reportSummary] = await Promise.all([
        api.getPayments(),
        api.getCharges(),
        api.getReportSummary(),
      ]);
      set((s) => ({
        payments: payments.map(mapPayment),
        charges: charges.map(mapCharge),
        reportSummary: normalizeReport(reportSummary),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to record payment';
      set({ error: message });
      throw err;
    }
  },

  assignTenantToProperty: async (tenantId, propertyId) => {
    set({ error: null });
    try {
      await api.patchTenant(tenantId, { propertyId });
      const tenants = await api.getTenants();
      set({ tenants: tenants.map(mapTenant) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign tenant';
      set({ error: message });
      throw err;
    }
  },

  totalDue: () => {
    const r = get().reportSummary;
    if (!r) return 0;
    return r.outstandingDues.reduce((s, d) => s + d.amount, 0);
  },

  totalCollectedThisMonth: () => {
    const r = get().reportSummary;
    if (!r) return 0;
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const row = r.monthlyCollection.find((x) => x.month === ym);
    return row ? row.total : 0;
  },

  overdueTenantCount: () => {
    const { charges } = get();
    const today = new Date().toISOString().slice(0, 10);
    const set = new Set<string>();
    for (const c of charges) {
      if ((c.status === 'PENDING' || c.status === 'PARTIAL') && c.dueDate < today) {
        set.add(c.tenantId);
      }
    }
    return set.size;
  },

  getMonthlyCollection: () => get().reportSummary?.monthlyCollection ?? [],
  getOutstandingDues: () => get().reportSummary?.outstandingDues ?? [],
  getPropertyWiseIncome: () => get().reportSummary?.propertyWiseIncome ?? [],
}));
