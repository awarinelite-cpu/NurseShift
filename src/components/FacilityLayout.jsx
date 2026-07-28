import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useFacility } from '../context/FacilityContext';
import ErrorBoundary from './ErrorBoundary';

export default function FacilityLayout() {
  const { facility, isDemo, signOut } = useFacility();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/facility/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          Nurse<span className="dot">Shift</span> <span style={{ opacity: 0.6, fontWeight: 500, fontSize: 13, marginLeft: 4 }}>for facilities</span>
        </div>
        {facility && (
          <nav>
            <NavLink to="/facility" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Claims
            </NavLink>
            <NavLink to="/facility/post" className={({ isActive }) => (isActive ? 'active' : '')}>
              Post a Shift
            </NavLink>
            <NavLink to="/facility/messages" className={({ isActive }) => (isActive ? 'active' : '')}>
              Messages
            </NavLink>
            <a onClick={handleSignOut} role="button">Sign out</a>
          </nav>
        )}
      </header>
      {isDemo && (
        <div className="demo-banner">
          Demo mode — signed in as the seeded facility (Reddington Hospital). Add Firebase config to go live.
        </div>
      )}
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  );
}
