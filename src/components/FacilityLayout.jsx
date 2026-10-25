import { useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useFacility } from '../context/FacilityContext';
import ErrorBoundary from './ErrorBoundary';
import Icon from './ns/Icon';

const TABS = [
  { to: '/facility', label: 'Home', icon: 'home', end: true },
  { to: '/facility/claims', label: 'Claims', icon: 'shieldCheck' },
  { to: '/facility/post', label: 'Post', icon: 'calendar' },
  { to: '/facility/messages', label: 'Messages', icon: 'message' },
];

// The facility surface uses the same mobile app shell as the nurse and admin
// screens: a phone-width column, a banner on every page and a bottom tab bar.
export default function FacilityLayout() {
  const { facility, isDemo } = useFacility();

  // The app look is light only; switch off dark / forest while a facility screen is open.
  useEffect(() => {
    const root = document.documentElement;
    const removed = ['dark', 'forest'].filter((c) => root.classList.contains(c));
    root.classList.remove(...removed);
    return () => root.classList.add(...removed);
  }, []);

  return (
    <div className="ns-stage ns-admin">
      <div className="ns-app">
        {isDemo && (
          <div className="ns-demo">Demo mode: signed in as the seeded facility (Reddington Hospital). Add Firebase config to go live.</div>
        )}
        <div className="ns-screen">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
        {facility && (
          <nav className="ns-nav" aria-label="Facility" style={{ gridTemplateColumns: `repeat(${TABS.length}, 1fr)` }}>
            {TABS.map((t) => (
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
