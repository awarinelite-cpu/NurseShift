import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { subscribeAdminStats } from '../../lib/admin';
import { useAdmin } from '../../context/AdminContext';

const CARDS = [
  { key: 'totalUsers', label: 'Nurses (total)', to: '/admin/nurses' },
  { key: 'activeUsers', label: 'Active right now', live: true, to: '/admin/nurses?filter=active' },
  { key: 'verifiedNurses', label: 'Verified nurses', to: '/admin/nurses?filter=verified' },
  { key: 'totalFacilities', label: 'Facilities', to: '/admin/facilities' },
  { key: 'totalShifts', label: 'Shifts (total)', to: '/admin/shifts' },
  { key: 'shiftsTaken', label: 'Shifts taken', to: '/admin/shifts?filter=taken' },
  { key: 'shiftsNotTaken', label: 'Shifts not taken', to: '/admin/shifts?filter=open' },
];

export default function AdminDashboard() {
  const { signOut } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const unsub = subscribeAdminStats(setStats);
    return () => unsub();
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">Live overview</p>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-sub">Updates automatically — no need to refresh.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <Link to="/admin/review" className="clock-btn" style={{ textDecoration: 'none' }}>License review</Link>
          <Link to="/admin/facilities" className="clock-btn" style={{ textDecoration: 'none' }}>Facilities</Link>
          <Link to="/admin/disputes" className="clock-btn" style={{ textDecoration: 'none' }}>Disputes</Link>
          <button className="clock-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      {!stats ? (
        <div className="empty-state">Loading live stats…</div>
      ) : (
        <div className="admin-stats-grid">
          {CARDS.map(({ key, label, live, to }) => (
            <Link
              to={to}
              className="admin-stat-card"
              key={key}
              style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              {live && <span className="admin-stat-live" aria-hidden="true" />}
              <p className="admin-stat-label">{label}</p>
              <p className="admin-stat-value">{stats[key]}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
