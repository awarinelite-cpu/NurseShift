import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function TopBar() {
  const { isDemo, nurse, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <>
      <header className="topbar">
        <div className="brand">
          Nurse<span className="dot">Shift</span>
        </div>
        <nav>
          {nurse ? (
            <>
              <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                Duty Board
              </NavLink>
              <NavLink to="/my-shifts" className={({ isActive }) => (isActive ? 'active' : '')}>
                My Shifts
              </NavLink>
              <NavLink to="/messages" className={({ isActive }) => (isActive ? 'active' : '')}>
                Messages
              </NavLink>
              <NavLink to="/nurses" className={({ isActive }) => (isActive ? 'active' : '')}>
                Nurses
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
                Profile
              </NavLink>
              <a onClick={handleSignOut} role="button">Sign out</a>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
                Sign in
              </NavLink>
              <NavLink to="/signup" className={({ isActive }) => (isActive ? 'active' : '')}>
                Sign up
              </NavLink>
            </>
          )}
        </nav>
      </header>
      {isDemo && (
        <div className="demo-banner">
          Demo mode — sign-up/login run against local mock state. Add your Firebase config in src/lib/firebase.js to go live.
        </div>
      )}
    </>
  );
}
