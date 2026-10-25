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
    <div className="ns-screen">
      <header className="ns-greet">
        <div>
          <p className="ns-greet-small">{greeting()}</p>
          <h1>{nurse.name} <span aria-hidden="true">👋</span></h1>
          <p className="ns-greet-role">Registered Nurse</p>
        </div>
        <div className="ns-greet-right">
          <Link to="/messages" className="ns-bell" aria-label="Messages">
            <Icon name="bell" size={22} />
          </Link>
          <Link to="/profile" className="ns-avatar" aria-label={`${firstName}'s profile`}>{initials(nurse.name)}</Link>
        </div>
      </header>

      <Link to="/profile" className={`ns-card ns-verify ${v.tone}`}>
        <span className="ns-verify-icon"><Icon name="shieldCheck" size={30} /></span>
        <span className="ns-verify-text">
          <small>Verification Status</small>
          <strong>{v.title}</strong>
          <em>{v.note}</em>
        </span>
        <Icon name="chevR" size={18} />
      </Link>

      <Link to="/earnings" className="ns-earn-card">
        <span className="ns-earn-icon"><Icon name="wallet" size={26} /></span>
        <span className="ns-earn-text">
          <small>Total Earnings</small>
          <strong>{formatNaira(month.total)}</strong>
          <em>This month</em>
        </span>
        <Icon name="trendingUp" size={64} strokeWidth={1.6} className="ns-earn-chart" />
      </Link>

      <div className="ns-stats">
        <Link to="/shifts" className="ns-stat blue">
          <span className="ns-stat-icon"><Icon name="calendar" size={22} /></span>
          <small>Available Shifts</small>
          <strong>{openCount ?? '-'}</strong>
        </Link>
        <Link to="/my-shifts" className="ns-stat green">
          <span className="ns-stat-icon"><Icon name="checkCircle" size={22} /></span>
          <small>Completed Shifts</small>
          <strong>{completedAll}</strong>
        </Link>
        <Link to="/profile" className="ns-stat amber">
          <span className="ns-stat-icon"><Icon name="star" size={22} fill="currentColor" /></span>
          <small>Average Rating</small>
          <strong>{nurse.rating ? Number(nurse.rating).toFixed(1) : '-'}</strong>
        </Link>
      </div>

      <h2 className="ns-h2">Quick Actions</h2>
      <div className="ns-actions">
        {ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className="ns-action">
            <span><Icon name={a.icon} size={22} /></span>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
