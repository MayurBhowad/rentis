import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, mapTenant, mapLedgerEntry } from '../api/client';
import type { LedgerEntry } from '../types';

export function TenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<{ id: string; name: string } | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([api.getTenant(tenantId), api.getLedger({ tenant_id: tenantId })])
      .then(([t, list]) => {
        if (cancelled) return;
        setTenant(mapTenant(t));
        setEntries(list.map(mapLedgerEntry));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [tenantId]);

  if (!tenantId) {
    return (
      <div className="page">
        <p>Invalid tenant.</p>
        <Link to="/tenants">Back to Tenants</Link>
      </div>
    );
  }
  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p><Link to="/tenants">← Tenants</Link></div>;
  if (!tenant) {
    return (
      <div className="page">
        <p>Tenant not found.</p>
        <Link to="/tenants">Back to Tenants</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{tenant.name}</h1>
      <p><Link to="/tenants">← Tenants</Link></p>
      <table className="table ledger-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Period</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td>{e.date}</td>
              <td>{e.type}</td>
              <td>{e.period}</td>
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
