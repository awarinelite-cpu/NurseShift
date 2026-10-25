import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listOpenShifts } from '../lib/shifts';
import { useClaims } from '../lib/useClaims';
import { formatNaira, initials, summarize } from '../lib/earnings';
import Icon from '../components/ns/Icon';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

const VERIFICATION = {
  verified: { title: 'Fully Verified', note: 'Your license and documents are all verified.', tone: 'ok' },
  pending: { title: 'Under Review', note: 'An admin is checking your license. This usually takes up to 48 hours.', tone: 'wait' },
  rejected: { title: 'Not Verified', note: 'Your license could not be verified. Contact support to fix this.', tone: 'bad' },
};

const ACTIONS = [
  { to: '/shifts', label: 'Find Shifts', icon: 'search' },
  { to: '/my-shifts', label: 'My Shifts', icon: 'calendar' },
  { to: '/earnings', label: 'Earnings', icon: 'wallet' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export default function Dashboard() {
  const { nurse } = useAuth();
  const { claims } = useClaims(nurse.id);
  const [openCount, setOpenCount] = useState(null);

  useEffect(() => {
    listOpenShifts().then((list) => setOpenCount(list.filter((s) => s.status === 'open').length));
  }, []);

  const month = summarize(claims, 'month');
  const completedAll = claims.filter((c) => c.status === 'completed').length;
  const v = VERIFICATION[nurse.verification] ?? VERIFICATION.pending;
  const firstName = nurse.name?.split(' ')[0] ?? '';

  return (
    <div className="ns-screen nsd-nurse">
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
            <Link to="/messages" className="nsd-bell" aria-label="Messages">
              <Icon name="bell" size={24} />
            </Link>
            <Link to="/profile" className="nsd-avatar" aria-label={`${firstName}'s profile`}>{initials(nurse.name)}</Link>
          </div>
        </div>

        <div className="nsd-greet nsd-greet-solo">
          <p>{greeting()}</p>
          <h1>{nurse.name} <span aria-hidden="true">👋</span></h1>
          <small>Registered Nurse</small>
        </div>
      </header>

      <Link to="/profile" className={`nsd-verify ${v.tone}`}>
        <span className="nsd-verify-icon"><Icon name="shieldCheck" size={30} /></span>
        <span className="nsd-verify-text">
          <small>Verification Status</small>
          <strong>{v.title}</strong>
          <em>{v.note}</em>
        </span>
        <Icon name="chevR" size={18} />
      </Link>

      <Link to="/earnings" className="nsd-earn">
        <span className="nsd-earn-icon"><Icon name="wallet" size={26} /></span>
        <span className="nsd-earn-text">
          <small>Total Earnings</small>
          <strong>{formatNaira(month.total)}</strong>
          <em>This month</em>
        </span>
        <Icon name="trendingUp" size={64} strokeWidth={1.6} className="nsd-earn-chart" />
      </Link>

      <div className="nsd-stats">
        <Link to="/shifts" className="nsd-stat blue">
          <span className="nsd-stat-icon"><Icon name="calendar" size={22} strokeWidth={2.2} /></span>
          <small>Available Shifts</small>
          <strong>{openCount ?? '-'}</strong>
          <span className="nsd-stat-foot"><em>Open now</em><Icon name="chevR" size={16} /></span>
        </Link>
        <Link to="/my-shifts" className="nsd-stat green">
          <span className="nsd-stat-icon"><Icon name="checkCircle" size={22} strokeWidth={2.2} /></span>
          <small>Completed Shifts</small>
          <strong>{completedAll}</strong>
          <span className="nsd-stat-foot"><em>All time</em><Icon name="chevR" size={16} /></span>
        </Link>
        <Link to="/profile" className="nsd-stat orange">
          <span className="nsd-stat-icon"><Icon name="star" size={22} fill="currentColor" /></span>
          <small>Average Rating</small>
          <strong>{nurse.rating ? Number(nurse.rating).toFixed(1) : '-'}</strong>
          <span className="nsd-stat-foot"><em>From facilities</em><Icon name="chevR" size={16} /></span>
        </Link>
      </div>

      <h2 className="nsd-h2">Quick Actions</h2>
      <div className="nsd-actions nsd-actions-4">
        {ACTIONS.map((a, i) => (
          <Link key={a.to} to={a.to} className="nsd-action">
            <span className={`nsd-action-icon ${['green', 'blue', 'orange', 'purple'][i % 4]}`}><Icon name={a.icon} size={22} /></span>
            <b>{a.label}</b>
            <Icon name="chevR" size={16} />
          </Link>
        ))}
      </div>
    </div>
  );
}
