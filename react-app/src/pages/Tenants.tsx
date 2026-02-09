import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

export function Tenants() {
  const tenants = useStore((s) => s.tenants);
  const properties = useStore((s) => s.properties);

  return (
    <div className="page">
      <h1>Tenants</h1>
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
