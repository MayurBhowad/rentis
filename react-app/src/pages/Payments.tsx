import { useState } from 'react';
import { useStore } from '../store/useStore';

export function Payments() {
  const tenants = useStore((s) => s.tenants);
  const payments = useStore((s) => s.payments);
  const addPayment = useStore((s) => s.addPayment);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);

  const [tenantId, setTenantId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!tenantId || !amt || amt <= 0) return;
    setSubmitting(true);
    try {
      await addPayment(tenantId, amt, date);
      setAmount('');
    } finally {
      setSubmitting(false);
    }
  };

  const sortedPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date));

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;

  return (
    <div className="page">
      <h1>Payments</h1>
      <form onSubmit={handleSubmit} className="form card">
        <h2>Add payment</h2>
        <div className="form-row">
          <label>Tenant</label>
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} required>
            <option value="">Select tenant</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Amount (₹)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="form-row">
          <label>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <button type="submit" disabled={submitting}>{submitting ? 'Recording…' : 'Record payment'}</button>
      </form>
      <h2>Payment history</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Tenant</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {sortedPayments.map((p) => (
            <tr key={p.id}>
              <td>{p.date}</td>
              <td>{tenants.find((t) => t.id === p.tenantId)?.name ?? p.tenantId}</td>
              <td>₹{p.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
