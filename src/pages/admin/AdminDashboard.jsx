import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscribeAdminStats } from '../../lib/admin';
import { useAdmin } from '../../context/AdminContext';
import Icon from '../../components/ns/Icon';

const STATS = [
  { key: 'totalUsers', label: 'Total Nurses', icon: 'users', tone: 'teal', to: '/admin/nurses',
    sub: (st) => `${st.activeUsers} active now`, ring: false },
  { key: 'verifiedNurses', label: 'Verified Nurses', icon: 'shieldCheck', tone: 'blue', to: '/admin/nurses?filter=verified',
    sub: (st) => `${pct(st.verifiedNurses, st.totalUsers)}% verified`, ring: true },
  { key: 'totalFacilities', label: 'Facilities', icon: 'building', tone: 'purple', to: '/admin/facilities',
    sub: () => 'Partner sites', ring: false },
  { key: 'totalShifts', label: 'Shifts (total)', icon: 'calendar', tone: 'orange', to: '/admin/shifts',
    sub: () => 'All posted shifts', ring: false },
  { key: 'shiftsTaken', label: 'Shifts taken', icon: 'check', tone: 'green', to: '/admin/shifts?filter=taken',
    sub: (st) => `${pct(st.shiftsTaken, st.totalShifts)}% completion rate`, ring: true },
  { key: 'shiftsNotTaken', label: 'Shifts not taken', icon: 'alert', tone: 'red', to: '/admin/shifts?filter=open',
    sub: (st) => `${pct(st.shiftsNotTaken, st.totalShifts)}% of total`, ring: true },
];

const ACTIONS = [
  { to: '/admin/review', label: 'License review', icon: 'shieldCheck', tone: 'green' },
  { to: '/admin/facilities', label: 'Facilities', icon: 'building', tone: 'blue' },
  { to: '/admin/disputes', label: 'Disputes', icon: 'alert', tone: 'orange' },
  { to: '/admin/nurses', label: 'Nurses', icon: 'users', tone: 'purple' },
  { to: '/admin/shifts', label: 'Shifts', icon: 'calendar', tone: 'green' },
  { to: '/admin/facilities/import', label: 'Import CSV', icon: 'file', tone: 'purple' },
];

function pct(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

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
    // The stream re-emits every couple of seconds; only re-render when a number changed.
    const unsub = subscribeAdminStats((next) =>
      setStats((prev) => (prev && Object.keys(next).every((k) => prev[k] === next[k]) ? prev : next))
    );
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
      <header className="nsd-hero">
        <div className="nsd-top">
          <div className="nsd-brand">
            <Icon name="logo" size={40} strokeWidth={1.8} className="nsd-logo" />
            <div>
              <strong>Nurse<span>Shift</span></strong>
              <small>Flexible Shifts. Healthier Communities.</small>
            </div>
          </div>
          <div className="nsd-top-right">
            <Link to="/admin/review" className="nsd-bell" aria-label="License review">
              <Icon name="bell" size={24} />
            </Link>
            <span className="nsd-avatar" aria-hidden="true">{initials(admin?.name || displayName)}</span>
          </div>
        </div>

        <div className="nsd-hero-row">
          <div className="nsd-greet">
            <p>{greeting()}</p>
            <h1>{displayName} <span aria-hidden="true">👋</span></h1>
            <small>Here&rsquo;s what&rsquo;s happening with your platform today.</small>
          </div>
          <Link to="/admin/settings" className="nsd-status">
            <Icon name="shieldCheck" size={28} className="nsd-status-icon" />
            <span>
              <em><i aria-hidden="true" /> Platform Status</em>
              <strong>All Systems Active</strong>
              <small>Everything is running smoothly</small>
            </span>
            <Icon name="chevR" size={18} />
          </Link>
        </div>
      </header>

      {!stats ? (
        <div className="ns-empty">Loading live stats...</div>
      ) : (
        <div className="nsd-stats">
          {STATS.map(({ key, label, icon, tone, to, sub, ring }) => (
            <Link to={to} className={`nsd-stat ${tone}`} key={key}>
              <span className="nsd-stat-icon"><Icon name={icon} size={22} strokeWidth={2.2} /></span>
              <small>{label}</small>
              <strong>{stats[key]}</strong>
              <span className="nsd-stat-foot">
                {ring && <i className="nsd-ring" aria-hidden="true" />}
                <em>{sub(stats)}</em>
                <Icon name="chevR" size={16} />
              </span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="nsd-h2">Quick Actions</h2>
      <div className="nsd-actions">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="nsd-action">
            <span className={`nsd-action-icon ${a.tone}`}><Icon name={a.icon} size={22} /></span>
            <b>{a.label}</b>
            <Icon name="chevR" size={16} />
          </Link>
        ))}
        <p className="nsd-tagline" aria-hidden="true">Better Healthcare Together</p>
      </div>

      <button type="button" className="ns-btn ns-btn-danger ns-btn-block" onClick={handleSignOut}>
        <Icon name="logout" size={18} /> Sign out
      </button>
    </>
  );
}
