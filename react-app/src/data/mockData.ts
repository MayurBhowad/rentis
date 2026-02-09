import type { Property, Tenant, Charge, Payment, Allocation } from '../types';

export const mockProperties: Property[] = [
  { id: 'p1', name: 'Block A - 101', address: '123 Main St' },
  { id: 'p2', name: 'Block A - 102', address: '123 Main St' },
  { id: 'p3', name: 'Block B - 201', address: '456 Oak Ave' },
];

export const mockTenants: Tenant[] = [
  { id: 't1', name: 'Alice Kumar', propertyId: 'p1' },
  { id: 't2', name: 'Bob Singh', propertyId: 'p2' },
  { id: 't3', name: 'Carol Verma', propertyId: 'p3' },
  { id: 't4', name: 'Unassigned Tenant', propertyId: null },
];

export const mockCharges: Charge[] = [
  { id: 'c1', tenantId: 't1', type: 'RENT', amount: 15000, period: '2025-01', dueDate: '2025-01-05', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'c2', tenantId: 't1', type: 'WATER', amount: 200, period: '2025-01', dueDate: '2025-01-10', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'c3', tenantId: 't1', type: 'ELECTRICITY', amount: 800, period: '2025-01', dueDate: '2025-01-15', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'c4', tenantId: 't1', type: 'RENT', amount: 15000, period: '2025-02', dueDate: '2025-02-05', createdAt: '2025-02-01T00:00:00Z' },
  { id: 'c5', tenantId: 't2', type: 'RENT', amount: 18000, period: '2025-01', dueDate: '2025-01-05', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'c6', tenantId: 't2', type: 'RENT', amount: 18000, period: '2025-02', dueDate: '2025-02-05', createdAt: '2025-02-01T00:00:00Z' },
  { id: 'c7', tenantId: 't3', type: 'RENT', amount: 12000, period: '2025-01', dueDate: '2025-01-05', createdAt: '2025-01-01T00:00:00Z' },
];

export const mockPayments: Payment[] = [
  { id: 'pm1', tenantId: 't1', amount: 16000, date: '2025-01-06', createdAt: '2025-01-06T10:00:00Z' },
  { id: 'pm2', tenantId: 't1', amount: 5000, date: '2025-01-20', createdAt: '2025-01-20T10:00:00Z' },
  { id: 'pm3', tenantId: 't2', amount: 18000, date: '2025-01-04', createdAt: '2025-01-04T10:00:00Z' },
  { id: 'pm4', tenantId: 't2', amount: 18000, date: '2025-02-03', createdAt: '2025-02-03T10:00:00Z' },
];

/** Allocations from mock payments applied to charges (FIFO). pm1: 16k → c1(15k)+c2(200)+c3(800); pm2: 5k → c4(5k). */
export const mockAllocations: Allocation[] = [
  { id: 'a1', paymentId: 'pm1', chargeId: 'c1', amount: 15000 },
  { id: 'a2', paymentId: 'pm1', chargeId: 'c2', amount: 200 },
  { id: 'a3', paymentId: 'pm1', chargeId: 'c3', amount: 800 },
  { id: 'a4', paymentId: 'pm2', chargeId: 'c4', amount: 5000 },
  { id: 'a5', paymentId: 'pm3', chargeId: 'c5', amount: 18000 },
  { id: 'a6', paymentId: 'pm4', chargeId: 'c6', amount: 18000 },
];
