import { useStore } from '../store/useStore';

export function Dashboard() {
  const totalDue = useStore((s) => s.totalDue());
  const totalCollectedThisMonth = useStore((s) => s.totalCollectedThisMonth());
  const overdueTenantCount = useStore((s) => s.overdueTenantCount());

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
