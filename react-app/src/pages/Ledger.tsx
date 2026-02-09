import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';

export function Ledger() {
  const tenants = useStore((s) => s.tenants);
  const properties = useStore((s) => s.properties);
  const getLedgerFiltered = useStore((s) => s.getLedgerFiltered);

  const [tenantId, setTenantId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const entries = useMemo(
    () =>
      getLedgerFiltered({
        tenantId: tenantId || undefined,
        propertyId: propertyId || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [getLedgerFiltered, tenantId, propertyId, from, to]
  );
  const showTenantColumn = new Set(entries.map((e) => e.tenantId)).size > 1;

  return (
    <div className="page">
      <h1>Ledger</h1>
      <div className="filters card">
        <div className="form-row">
          <label>Tenant</label>
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">All</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Property</label>
          <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">All</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>From date</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-row">
          <label>To date</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <table className="table ledger-table">
        <thead>
          <tr>
            <th>Date</th>
            {showTenantColumn && <th>Tenant</th>}
            <th>Type</th>
            <th>Period</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td>{e.date}</td>
              {showTenantColumn && <td>{tenants.find((t) => t.id === e.tenantId)?.name ?? e.tenantId}</td>}
              <td>{e.type}</td>
              <td>{e.period}</td>
              <td>{e.description}</td>
              <td>{e.debit ? `₹${e.debit.toLocaleString()}` : ''}</td>
              <td>{e.credit ? `₹${e.credit.toLocaleString()}` : ''}</td>
              <td>₹{e.balance.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
