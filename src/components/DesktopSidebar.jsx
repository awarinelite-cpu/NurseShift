import { NavLink, useNavigate } from 'react-router-dom';
import Icon from './ns/Icon';
import { initials } from '../lib/earnings';

// Left sidebar shown only on desktop-width screens (>= 1024px, see styles/desktop.css).
// On phones it is hidden and the bottom tab bar is used instead.
export default function DesktopSidebar({ tabs, extra = [], label, user, userPhoto, onSignOut, signOutTo = '/login' }) {
  const navigate = useNavigate();
  const link = (t) => (
    <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `ns-side-link${isActive ? ' active' : ''}`}>
      <Icon name={t.icon} size={20} strokeWidth={1.9} />
      <span>{t.label}</span>
    </NavLink>
  );

  async function handleSignOut() {
    await onSignOut?.();
    navigate(signOutTo);
  }

  return (
    <aside className="ns-side" aria-label="Sidebar">
      <div className="ns-side-brand">
        <Icon name="logo" size={34} strokeWidth={1.8} />
        <div>
          <strong>Nurse<span>Shift</span></strong>
          {label && <small>{label}</small>}
        </div>
      </div>
      <nav className="ns-side-nav" aria-label="Main">
        {tabs.map(link)}
        {extra.length > 0 && <div className="ns-side-sep" />}
        {extra.map(link)}
      </nav>
      {user && (
        <div className="ns-side-user">
          <span className="ns-side-avatar">{userPhoto ? <img src={userPhoto} alt="" className="ns-avatar-img" /> : initials(user)}</span>
          <span className="ns-side-name">{user}</span>
          {onSignOut && (
            <button type="button" className="ns-side-out" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
              <Icon name="logout" size={18} />
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
