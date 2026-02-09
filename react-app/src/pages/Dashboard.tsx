import { useStore } from '../store/useStore';

export function Dashboard() {
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const totalDue = useStore((s) => s.totalDue());
  const totalCollectedThisMonth = useStore((s) => s.totalCollectedThisMonth());
  const overdueTenantCount = useStore((s) => s.overdueTenantCount());

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="cards">
        <div className="card">
          <div className="card-label">Total due</div>
          <div className="card-value">₹{totalDue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="card-label">Collected this month</div>
          <div className="card-value">₹{totalCollectedThisMonth.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="card-label">Overdue tenants</div>
          <div className="card-value">{overdueTenantCount}</div>
        </div>
      </div>
    </div>
  );
}
