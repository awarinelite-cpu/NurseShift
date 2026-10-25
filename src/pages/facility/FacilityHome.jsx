import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFacility } from '../../context/FacilityContext';
import { listClaimsForFacility, listShiftsForFacility } from '../../lib/facility';
import Icon from '../../components/ns/Icon';

const ACTIONS = [
  { to: '/facility/claims', label: 'Claims', icon: 'shieldCheck', tone: 'green' },
  { to: '/facility/post', label: 'Post a Shift', icon: 'calendar', tone: 'blue' },
  { to: '/facility/messages', label: 'Messages', icon: 'message', tone: 'purple' },
  { to: '/facility/claims', label: 'Rate nurses', icon: 'star', tone: 'orange' },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'F';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function FacilityHome() {
  const { facility, signOut } = useFacility();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!facility?.id) return undefined;
    let live = true;
    Promise.all([listShiftsForFacility(facility.id), listClaimsForFacility(facility.id)])
      .then(([shifts, claims]) => live && setData({ shifts, claims }))
      .catch(() => live && setData({ shifts: [], claims: [] }));
    return () => { live = false; };
  }, [facility?.id]);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const shifts = data?.shifts ?? [];
  const claims = data?.claims ?? [];
  const pending = claims.filter((c) => c.status === 'pending').length;
  const tiles = [
    { label: 'Shifts posted', value: shifts.length, icon: 'calendar', tone: 'teal', to: '/facility/claims', foot: 'All time' },
    { label: 'Open shifts', value: shifts.filter((s) => !s.status || s.status === 'open').length, icon: 'briefcase', tone: 'blue', to: '/facility/post', foot: 'Waiting for nurses' },
    { label: 'Pending claims', value: pending, icon: 'alert', tone: 'orange', to: '/facility/claims', foot: 'Need your decision' },
    { label: 'Upcoming', value: claims.filter((c) => c.status === 'approved').length, icon: 'clock', tone: 'purple', to: '/facility/claims', foot: 'Approved nurses' },
    { label: 'Completed', value: claims.filter((c) => c.status === 'completed').length, icon: 'check', tone: 'green', to: '/facility/claims', foot: 'Shifts done' },
    { label: 'To rate', value: claims.filter((c) => c.status === 'completed' && !c.rated).length, icon: 'star', tone: 'red', to: '/facility/claims', foot: 'Rate the nurse' },
  ];

  return (
    <>
      <header className="nsd-hero">
        <div className="nsd-top">
          <div className="nsd-brand">
            <Icon name="logo" size={40} strokeWidth={1.8} className="nsd-logo" />
            <div>
              <strong>Nurse<span>Shift</span></strong>
              <small>for facilities</small>
            </div>
          </div>
          <div className="nsd-top-right">
            <Link to="/facility/messages" className="nsd-bell" aria-label="Messages"><Icon name="bell" size={24} /></Link>
            <span className="nsd-avatar" aria-hidden="true">{initials(facility?.name)}</span>
          </div>
        </div>
        <div className="nsd-greet nsd-greet-solo">
          <p>{greeting()}</p>
          <h1>{facility?.name ?? 'Facility'}</h1>
          <small>Here&rsquo;s what&rsquo;s happening with your shifts today.</small>
        </div>
      </header>

      {pending > 0 && (
        <Link to="/facility/claims" className="nsd-notice">
          <Icon name="alert" size={22} />
          <span><strong>{pending} claim{pending === 1 ? '' : 's'} awaiting your decision</strong><small>Approve or reject to lock in your nurses.</small></span>
          <Icon name="chevR" size={18} />
        </Link>
      )}

      {!data ? (
        <div className="ns-empty">Loading your overview...</div>
      ) : (
        <div className="nsd-stats">
          {tiles.map((t) => (
            <Link to={t.to} className={`nsd-stat ${t.tone}`} key={t.label}>
              <span className="nsd-stat-icon"><Icon name={t.icon} size={22} strokeWidth={2.2} /></span>
              <small>{t.label}</small>
              <strong>{t.value}</strong>
              <span className="nsd-stat-foot"><em>{t.foot}</em><Icon name="chevR" size={16} /></span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="nsd-h2">Quick Actions</h2>
      <div className="nsd-actions nsd-actions-4">
        {ACTIONS.map((a) => (
          <Link key={a.label} to={a.to} className="nsd-action">
            <span className={`nsd-action-icon ${a.tone}`}><Icon name={a.icon} size={22} /></span>
            <b>{a.label}</b>
            <Icon name="chevR" size={16} />
          </Link>
        ))}
      </div>

      <button type="button" className="ns-btn ns-btn-danger ns-btn-block" onClick={handleSignOut}>
        <Icon name="logout" size={18} /> Sign out
      </button>
    </>
  );
}
