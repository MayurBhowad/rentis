import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/properties', label: 'Properties' },
  { path: '/tenants', label: 'Tenants' },
  { path: '/payments', label: 'Payments' },
  { path: '/ledger', label: 'Ledger' },
  { path: '/reports', label: 'Reports' },
];

export function Navbar() {
  const location = useLocation();
  return (
    <nav className="navbar">
      {navItems.map(({ path, label }) => (
        <Link
          key={path}
          to={path}
          className={location.pathname === path ? 'nav-link active' : 'nav-link'}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
