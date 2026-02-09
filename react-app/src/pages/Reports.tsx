import { useStore } from '../store/useStore';

export function Reports() {
  const getMonthlyCollection = useStore((s) => s.getMonthlyCollection);
  const getOutstandingDues = useStore((s) => s.getOutstandingDues);
  const getPropertyWiseIncome = useStore((s) => s.getPropertyWiseIncome);
  const tenants = useStore((s) => s.tenants);
  const properties = useStore((s) => s.properties);

  const monthly = getMonthlyCollection();
  const outstanding = getOutstandingDues();
  const byProperty = getPropertyWiseIncome();

  return (
    <div className="page">
      <h1>Reports</h1>
      <section className="card">
        <h2>Monthly collection</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map(({ month, total }) => (
              <tr key={month}>
                <td>{month}</td>
                <td>₹{total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2>Outstanding dues</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {outstanding.map(({ tenantId, amount }) => (
              <tr key={tenantId}>
                <td>{tenants.find((t) => t.id === tenantId)?.name ?? tenantId}</td>
                <td>₹{amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card">
        <h2>Property-wise income</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {byProperty.map(({ propertyId, total }) => (
              <tr key={propertyId}>
                <td>{propertyId === 'unassigned' ? 'Unassigned' : properties.find((p) => p.id === propertyId)?.name ?? propertyId}</td>
                <td>₹{total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
