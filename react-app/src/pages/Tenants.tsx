import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function Tenants() {
  const tenants = useStore((s) => s.tenants);
  const properties = useStore((s) => s.properties);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const addTenant = useStore((s) => s.addTenant);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPropertyId, setNewPropertyId] = useState<string>('');

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await addTenant(name, newPropertyId || null);
      setNewName('');
      setNewPropertyId('');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;

  return (
    <div className="page">
      <h1>Tenants</h1>
      <form onSubmit={handleAddTenant} className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Add tenant</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
          <label>
            Name <span className="muted">(required)</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Alice Kumar"
              required
              disabled={adding}
              style={{ display: 'block', marginTop: '0.25rem' }}
            />
          </label>
          <label>
            Property
            <select
              value={newPropertyId}
              onChange={(e) => setNewPropertyId(e.target.value)}
              disabled={adding}
              style={{ display: 'block', marginTop: '0.25rem' }}
            >
              <option value="">— None —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={adding || !newName.trim()}>
            {adding ? 'Adding…' : 'Add tenant'}
          </button>
        </div>
      </form>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Property</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td>{t.propertyId ? properties.find((p) => p.id === t.propertyId)?.name ?? t.propertyId : '—'}</td>
              <td>
                <Link to={`/tenants/${t.id}`}>View ledger</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
