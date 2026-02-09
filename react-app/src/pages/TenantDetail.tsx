import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function TenantDetail() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const tenants = useStore((s) => s.tenants);
  const getLedgerForTenant = useStore((s) => s.getLedgerForTenant);

  const tenant = tenants.find((t) => t.id === tenantId);
  const entries = tenantId ? getLedgerForTenant(tenantId) : [];

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
