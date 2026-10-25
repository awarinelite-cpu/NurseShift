import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import ErrorBoundary from './ErrorBoundary';
import Icon from './ns/Icon';

const TABS = [
  { to: '/admin', label: 'Home', icon: 'home', end: true },
  { to: '/admin/review', label: 'Review', icon: 'shieldCheck' },
  { to: '/admin/facilities', label: 'Facilities', icon: 'building' },
  { to: '/admin/disputes', label: 'Disputes', icon: 'alert' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings', ownerOnly: true },
];

// The admin surface uses the same mobile app shell as the nurse screens:
// a centered phone-width column, a bottom tab bar and the green card style.
export default function AdminShell() {
  const { admin, isDemo } = useAdmin();

  // The nurse look is light only, so switch off the dark / forest theme while an
  // admin screen is open and put it back when leaving.
  useEffect(() => {
    const root = document.documentElement;
    const removed = ['dark', 'forest'].filter((c) => root.classList.contains(c));
    root.classList.remove(...removed);
    return () => root.classList.add(...removed);
  }, []);

  const tabs = TABS.filter((t) => !t.ownerOnly || admin?.role !== 'subadmin');

  return (
    <div className="ns-stage ns-admin">
      <div className="ns-app">
        {isDemo && (
          <div className="ns-demo">Demo mode: admin sign-in and data are local samples. Add your Firebase config in src/lib/firebase.js to go live.</div>
        )}
        <div className="ns-screen">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
        {admin && (
          <nav className="ns-nav" aria-label="Admin" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `ns-tab${isActive ? ' active' : ''}`}>
                <Icon name={t.icon} size={22} strokeWidth={1.9} />
                <span>{t.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
