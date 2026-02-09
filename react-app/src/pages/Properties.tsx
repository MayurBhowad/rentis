import { useState } from 'react';
import { useStore } from '../store/useStore';

export function Properties() {
  const properties = useStore((s) => s.properties);
  const tenants = useStore((s) => s.tenants);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const assignTenantToProperty = useStore((s) => s.assignTenantToProperty);

  const [assigning, setAssigning] = useState(false);

  const handleAssign = async (currentTenantId: string | undefined, newTenantId: string | null, propertyId: string) => {
    setAssigning(true);
    try {
      if (currentTenantId) await assignTenantToProperty(currentTenantId, null);
      if (newTenantId) await assignTenantToProperty(newTenantId, propertyId);
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (error) return <div className="page"><p className="error">{error}</p></div>;

  return (
    <div className="page">
      <h1>Properties</h1>
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
