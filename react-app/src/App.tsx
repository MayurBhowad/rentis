import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { Tenants } from './pages/Tenants';
import { TenantDetail } from './pages/TenantDetail';
import { Payments } from './pages/Payments';
import { Ledger } from './pages/Ledger';
import { Reports } from './pages/Reports';
import { useStore } from './store/useStore';
import './App.css';

function App() {
  const loadAll = useStore((s) => s.loadAll);
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <Navbar />
        </header>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/tenants/:tenantId" element={<TenantDetail />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
