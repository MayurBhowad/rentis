import { useStore } from '../store/useStore';

export function Properties() {
  const properties = useStore((s) => s.properties);
  const tenants = useStore((s) => s.tenants);
  const assignTenantToProperty = useStore((s) => s.assignTenantToProperty);

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
                  if (currentTenantId) assignTenantToProperty(currentTenantId, null);
                  if (newTenantId) assignTenantToProperty(newTenantId, p.id);
                }}
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
