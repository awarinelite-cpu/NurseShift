import { Outlet } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function AdminLayout({ label = 'admin' }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          Nurse<span className="dot">Shift</span> <span style={{ opacity: 0.6, fontWeight: 500, fontSize: '0.75rem', marginLeft: 4 }}>{label}</span>
        </div>
        <ThemeToggle inline />
      </header>
      <Outlet />
    </div>
  );
}
