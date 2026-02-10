import { useState } from 'react';
import { useStore } from '../store/useStore';

export function Properties() {
  const properties = useStore((s) => s.properties);
  const tenants = useStore((s) => s.tenants);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const assignTenantToProperty = useStore((s) => s.assignTenantToProperty);
  const addProperty = useStore((s) => s.addProperty);

  const [assigning, setAssigning] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleAssign = async (currentTenantId: string | undefined, newTenantId: string | null, propertyId: string) => {
    setAssigning(true);
    try {
      if (currentTenantId) await assignTenantToProperty(currentTenantId, null);
      if (newTenantId) await assignTenantToProperty(newTenantId, propertyId);
    } finally {
      setAssigning(false);
    }
  };

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setAdding(true);
    try {
      await addProperty(name, newAddress.trim() || undefined);
      setNewName('');
      setNewAddress('');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;

  return (
    <div className="page">
      <h1>Properties</h1>
      <form onSubmit={handleAddProperty} className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Add property</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
          <label>
            Name <span className="muted">(required)</span>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Block A-101"
              required
              disabled={adding}
              style={{ display: 'block', marginTop: '0.25rem' }}
            />
          </label>
          <label>
            Address
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="e.g. 123 Main St"
              disabled={adding}
              style={{ display: 'block', marginTop: '0.25rem' }}
            />
          </label>
          <button type="submit" disabled={adding || !newName.trim()}>
            {adding ? 'Adding…' : 'Add property'}
          </button>
        </div>
      </form>
      <ul className="list">
        {properties.map((p) => (
          <li key={p.id} className="list-item card">
            <div>
              <strong>{p.name}</strong>
              {p.address && <span className="muted"> — {p.address}</span>}
            </div>
            <div className="assign-section">
              <label>Assign tenant: </label>
              <select
                value={tenants.find((t) => t.propertyId === p.id)?.id ?? ''}
                onChange={(e) => {
                  const currentTenantId = tenants.find((t) => t.propertyId === p.id)?.id;
                  const newTenantId = e.target.value || null;
                  handleAssign(currentTenantId, newTenantId, p.id);
                }}
                disabled={assigning}
              >
                <option value="">— None —</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
