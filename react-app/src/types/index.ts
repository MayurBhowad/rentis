export type ChargeType = 'RENT' | 'WATER' | 'ELECTRICITY' | 'OTHER';

export interface Property {
  id: string;
  name: string;
  address?: string;
}

export interface Tenant {
  id: string;
  name: string;
  propertyId: string | null;
}

export interface Charge {
  id: string;
  tenantId: string;
  type: ChargeType;
  amount: number;
  period: string; // e.g. "2025-01"
  dueDate: string; // ISO date
  createdAt: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  date: string; // ISO date
  createdAt: string;
}

/** How much of a payment was applied to a charge (FIFO). */
export interface Allocation {
  id: string;
  paymentId: string;
  chargeId: string;
  amount: number;
}

/** One row in the ledger view: either a charge (debit) or payment (credit). */
export interface LedgerEntry {
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
}
