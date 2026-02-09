const API_BASE = '/api';

export interface ApiProperty {
  _id: string;
  name: string;
  address?: string;
}
export interface ApiTenant {
  _id: string;
  name: string;
  propertyId?: { _id: string; name?: string; address?: string } | string | null;
}
export interface ApiCharge {
  _id: string;
  residentId: string;
  type: string;
  amount: number;
  paidAmount: number;
  status: string;
  periodFrom: string;
  periodTo: string;
  dueDate: string;
}
export interface ApiPayment {
  _id: string;
  residentId: string;
  amount: number;
  date: string;
}
export interface ApiLedgerEntry {
  date: string;
  type: string;
  periodFrom?: string;
  periodTo?: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  residentId: string;
  chargeId?: string;
  paymentId?: string;
}
export interface ApiReportSummary {
  monthlyCollection: { month: string; total: number }[];
  outstandingDues: { residentId: string; amount: number }[];
  propertyWiseIncome: { propertyId: string; total: number }[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

export const api = {
  getProperties: () => request<ApiProperty[]>('/properties'),
  postProperty: (body: { name: string; address?: string }) =>
    request<ApiProperty>('/properties', { method: 'POST', body: JSON.stringify(body) }),

  getTenants: () => request<ApiTenant[]>('/tenants'),
  getTenant: (id: string) => request<ApiTenant>(`/tenants/${id}`),
  postTenant: (body: { name: string; propertyId?: string | null }) =>
    request<ApiTenant>('/tenants', { method: 'POST', body: JSON.stringify(body) }),
  patchTenant: (id: string, body: { propertyId: string | null }) =>
    request<ApiTenant>(`/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  getCharges: (params?: { tenant_id?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.tenant_id) q.set('tenant_id', params.tenant_id);
    if (params?.status) q.set('status', params.status);
    const query = q.toString();
    return request<ApiCharge[]>(`/charges${query ? `?${query}` : ''}`);
  },
  postCharge: (body: {
    tenant_id: string;
    type: string;
    amount: number;
    period_from: string;
    period_to: string;
    due_date: string;
  }) => request<ApiCharge>('/charges', { method: 'POST', body: JSON.stringify(body) }),

  getPayments: (params?: { tenant_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.tenant_id) q.set('tenant_id', params.tenant_id);
    const query = q.toString();
    return request<ApiPayment[]>(`/payments${query ? `?${query}` : ''}`);
  },
  postPayment: (body: { tenant_id: string; amount: number; date?: string }) =>
    request<ApiPayment>('/payments', { method: 'POST', body: JSON.stringify(body) }),

  getLedger: (params?: { tenant_id?: string; property_id?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.tenant_id) q.set('tenant_id', params.tenant_id);
    if (params?.property_id) q.set('property_id', params.property_id);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const query = q.toString();
    return request<ApiLedgerEntry[]>(`/ledger${query ? `?${query}` : ''}`);
  },

  getReportSummary: () => request<ApiReportSummary>('/reports/summary'),
};

export function mapProperty(p: ApiProperty): { id: string; name: string; address?: string } {
  return { id: p._id, name: p.name, address: p.address };
}
export function mapTenant(t: ApiTenant): { id: string; name: string; propertyId: string | null } {
  const pid = t.propertyId;
  return {
    id: t._id,
    name: t.name,
    propertyId: pid == null || pid === '' ? null : (typeof pid === 'object' ? pid._id : pid),
  };
}
export function mapCharge(c: ApiCharge): {
  id: string;
  tenantId: string;
  type: 'RENT' | 'WATER' | 'ELECTRICITY' | 'OTHER';
  amount: number;
  period: string;
  dueDate: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID';
  createdAt: string;
} {
  const due = c.dueDate;
  return {
    id: c._id,
    tenantId: c.residentId,
    type: c.type as 'RENT' | 'WATER' | 'ELECTRICITY' | 'OTHER',
    amount: c.amount,
    period: c.periodFrom,
    dueDate: typeof due === 'string' ? due.slice(0, 10) : (due as unknown as Date)?.toISOString?.()?.slice(0, 10) ?? '',
    status: (c.status as 'PENDING' | 'PARTIAL' | 'PAID') ?? 'PENDING',
    createdAt: '',
  };
}
export function mapPayment(p: ApiPayment): { id: string; tenantId: string; amount: number; date: string; createdAt: string } {
  const d = p.date;
  return {
    id: p._id,
    tenantId: p.residentId,
    amount: p.amount,
    date: typeof d === 'string' ? d.slice(0, 10) : (d as unknown as Date)?.toISOString?.()?.slice(0, 10) ?? '',
    createdAt: '',
  };
}
export function mapLedgerEntry(e: ApiLedgerEntry): {
  date: string;
  tenantId: string;
  type: 'CHARGE' | 'PAYMENT';
  period: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  chargeId?: string;
  paymentId?: string;
} {
  const period = e.periodFrom && e.periodTo ? `${e.periodFrom}–${e.periodTo}` : (e.periodFrom ?? e.periodTo ?? '-');
  return {
    date: e.date,
    tenantId: typeof e.residentId === 'string' ? e.residentId : (e.residentId as unknown as { _id?: string })?._id ?? '',
    type: e.type === 'CHARGE' || e.type === 'PAYMENT' ? e.type : 'CHARGE',
    period,
    description: e.description,
    debit: e.debit,
    credit: e.credit,
    balance: e.balance,
    chargeId: e.chargeId,
    paymentId: e.paymentId,
  };
}
