import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscribeAdminStats } from '../../lib/admin';
import { useAdmin } from '../../context/AdminContext';
import Icon from '../../components/ns/Icon';

const STATS = [
  { key: 'totalUsers', label: 'Nurses (total)', icon: 'users', tone: 'blue', to: '/admin/nurses' },
  { key: 'verifiedNurses', label: 'Verified nurses', icon: 'shieldCheck', tone: 'green', to: '/admin/nurses?filter=verified' },
  { key: 'totalFacilities', label: 'Facilities', icon: 'building', tone: 'amber', to: '/admin/facilities' },
  { key: 'totalShifts', label: 'Shifts (total)', icon: 'calendar', tone: 'blue', to: '/admin/shifts' },
  { key: 'shiftsTaken', label: 'Shifts taken', icon: 'checkCircle', tone: 'green', to: '/admin/shifts?filter=taken' },
  { key: 'shiftsNotTaken', label: 'Shifts not taken', icon: 'briefcase', tone: 'amber', to: '/admin/shifts?filter=open' },
];

const ACTIONS = [
  { to: '/admin/review', label: 'License review', icon: 'shieldCheck' },
  { to: '/admin/facilities', label: 'Facilities', icon: 'building' },
  { to: '/admin/disputes', label: 'Disputes', icon: 'alert' },
  { to: '/admin/nurses', label: 'Nurses', icon: 'users' },
  { to: '/admin/shifts', label: 'Shifts', icon: 'calendar' },
  { to: '/admin/facilities/import', label: 'Import CSV', icon: 'file' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function AdminDashboard() {
  const { admin, signOut } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const unsub = subscribeAdminStats(setStats);
    return () => unsub();
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const isSub = admin?.role === 'subadmin';
  const actions = isSub ? ACTIONS : [...ACTIONS, { to: '/admin/settings', label: 'Settings', icon: 'settings' }];
  const displayName = admin?.name || admin?.email?.split('@')[0] || 'Admin';

  return (
    <>
      <header className="ns-greet">
        <div>
          <p className="ns-greet-small">{greeting()}</p>
          <h1>{displayName} <span aria-hidden="true">👋</span></h1>
          <p className="ns-greet-role">{isSub ? 'Subadmin' : 'Owner'} · Live overview</p>
        </div>
        <div className="ns-greet-right">
          <span className="ns-avatar" aria-hidden="true">{initials(admin?.name || displayName)}</span>
        </div>
      </header>

      {!stats ? (
        <div className="ns-empty">Loading live stats...</div>
      ) : (
        <>
          <Link to="/admin/nurses?filter=active" className="ns-earn-card">
            <span className="ns-earn-icon"><Icon name="users" size={26} /></span>
            <span className="ns-earn-text">
              <small>Active right now</small>
              <strong>{stats.activeUsers}</strong>
              <em><span className="ns-live-dot" aria-hidden="true" /> Updates automatically</em>
            </span>
            <Icon name="trendingUp" size={64} strokeWidth={1.6} className="ns-earn-chart" />
          </Link>

          <div className="ns-stats">
            {STATS.map(({ key, label, icon, tone, to }) => (
              <Link to={to} className={`ns-stat ${tone}`} key={key}>
                <span className="ns-stat-icon"><Icon name={icon} size={22} /></span>
                <small>{label}</small>
                <strong>{stats[key]}</strong>
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="ns-h2">Quick Actions</h2>
      <div className="ns-actions">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="ns-action">
            <span><Icon name={a.icon} size={22} /></span>
            {a.label}
          </Link>
        ))}
      </div>

      <button type="button" className="ns-btn ns-btn-danger ns-btn-block" onClick={handleSignOut}>
        <Icon name="logout" size={18} /> Sign out
      </button>
    </>
  );
}
