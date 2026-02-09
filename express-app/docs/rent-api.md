# Rent Management API

Base URL: `/api`. No authentication required (owner-only usage).

## Properties

**POST /api/properties**
- Body: `{ "name": "Block A-101", "address": "123 Main St" }`
- Response `201`: `{ "_id": "...", "name": "Block A-101", "address": "123 Main St", "createdAt": "...", "updatedAt": "..." }`

**GET /api/properties**
- Response `200`: `[{ "_id": "...", "name": "Block A-101", "address": "123 Main St" }, ...]`

---

## Tenants (residents)

**POST /api/tenants**
- Body: `{ "name": "Alice Kumar", "propertyId": "<property_id or omit>" }`
- Response `201`: `{ "_id": "...", "name": "Alice Kumar", "propertyId": "..." }`

**GET /api/tenants**
- Response `200`: `[{ "_id": "...", "name": "Alice Kumar", "propertyId": { "_id": "...", "name": "Block A-101" } }, ...]`

**GET /api/tenants/:id**
- Response `200`: `{ "_id": "...", "name": "Alice Kumar", "propertyId": { "_id": "...", "name": "Block A-101", "address": "..." } }`
- Response `404`: `{ "message": "Tenant not found" }`

---

## Charges

**POST /api/charges**
- Body: `{ "tenant_id": "<resident_id>", "type": "RENT", "amount": 15000, "period_from": "2025-01", "period_to": "2025-01", "due_date": "2025-01-05" }`
- `type`: one of `RENT`, `WATER`, `ELECTRICITY`, `OTHER`
- Response `201`: `{ "_id": "...", "residentId": "...", "type": "RENT", "amount": 15000, "paidAmount": 0, "status": "PENDING", "periodFrom": "2025-01", "periodTo": "2025-01", "dueDate": "..." }`

**GET /api/charges**
- Query: `tenant_id`, `status` (PENDING | PARTIAL | PAID)
- Response `200`: `[{ "_id": "...", "residentId": "...", "type": "RENT", "amount": 15000, "paidAmount": 5000, "status": "PARTIAL", ... }, ...]`

---

## Payments

**POST /api/payments**
- On creation: payment is applied to oldest unpaid charges first (FIFO). Charge `paidAmount` and `status` are updated.
- Body: `{ "tenant_id": "<resident_id>", "amount": 10000, "date": "2025-01-15" }` (date optional, defaults to now)
- Response `201`: `{ "_id": "...", "residentId": "...", "amount": 10000, "date": "2025-01-15T00:00:00.000Z" }`

**GET /api/payments**
- Query: `tenant_id`
- Response `200`: `[{ "_id": "...", "residentId": "...", "amount": 10000, "date": "..." }, ...]`

**DELETE /api/payments/:id**
- Reverses allocations: decrements charge `paidAmount` and updates status; deletes allocation records; then deletes the payment.
- Response `204` (no body)

---

## Ledger

**GET /api/ledger**
- Query: `tenant_id`, `property_id`, `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)
- Returns combined chronological view: charges (debit), payments (credit), running balance.
- Response `200`: `[{ "date": "2025-01-01", "type": "CHARGE", "periodFrom": "2025-01", "periodTo": "2025-01", "description": "RENT 2025-01–2025-01", "debit": 15000, "credit": 0, "balance": 15000, "residentId": "...", "chargeId": "..." }, { "date": "2025-01-15", "type": "PAYMENT", "description": "Payment", "debit": 0, "credit": 10000, "balance": 5000, "residentId": "...", "paymentId": "..." }, ...]`

---

## Reports

**GET /api/reports/summary**
- Response `200`:
```json
{
  "monthlyCollection": [{ "month": "2025-01", "total": 45000 }, { "month": "2025-02", "total": 36000 }],
  "outstandingDues": [{ "residentId": "...", "amount": 10000 }],
  "propertyWiseIncome": [{ "propertyId": "...", "total": 50000 }, { "propertyId": "unassigned", "total": 0 }]
}
```
