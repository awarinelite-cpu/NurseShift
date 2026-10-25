import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClaims } from '../lib/useClaims';
import { formatNaira, fmtDay, summarize, titleFor } from '../lib/earnings';
import Icon from '../components/ns/Icon';
import FacilityThumb from '../components/ns/FacilityThumb';

const RANGES = [
  { key: 'month', label: 'This Month', sub: 'This month' },
  { key: '3months', label: 'Last 3 Months', sub: 'Last 3 months' },
  { key: 'all', label: 'All Time', sub: 'All time' },
];

export default function Earnings() {
  const { nurse } = useAuth();
  const { claims, loading } = useClaims(nurse.id);
  const [range, setRange] = useState('month');
  const [showAll, setShowAll] = useState(false);

  const s = summarize(claims, range);
  const rows = showAll ? s.rows : s.rows.slice(0, 4);

  return (
    <div className="ns-screen">
      <header className="ns-topbar center">
        <h1>Earnings</h1>
      </header>

      <section className="ns-earn-hero">
        <div>
          <small>Total Earnings</small>
          <strong>{formatNaira(s.total)}</strong>
          <em>{RANGES.find((r) => r.key === range).sub}</em>
        </div>
        <Icon name="trendingUp" size={78} strokeWidth={1.6} className="ns-earn-chart" />
      </section>

      <div className="ns-tabs flat" role="tablist">
        {RANGES.map((r) => (
          <button key={r.key} type="button" role="tab" aria-selected={range === r.key} className={range === r.key ? 'on' : ''} onClick={() => { setRange(r.key); setShowAll(false); }}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="ns-grid2">
        <div className="ns-card ns-figure"><small>Completed Shifts</small><strong>{s.count}</strong></div>
        <div className="ns-card ns-figure"><small>Avg. Per Shift</small><strong>{formatNaira(s.average)}</strong></div>
        <div className="ns-card ns-figure"><small>Pending Payments</small><strong>{formatNaira(s.pending)}</strong></div>
        <div className="ns-card ns-figure"><small>Next Payout</small><strong>{s.nextPayout.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></div>
      </div>

      <div className="ns-h2-row">
        <h2 className="ns-h2">Recent Transactions</h2>
        {s.rows.length > 4 && (
          <button type="button" className="ns-link" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'Show less' : 'View All'} <Icon name="arrowRight" size={13} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="ns-empty">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="ns-empty">No completed shifts in this period yet.</div>
      ) : (
        <ul className="ns-tx">
          {rows.map((c) => (
            <li key={c.id}>
              <FacilityThumb seed={c.shift.facilityId ?? c.shift.facility} facilityId={c.shift.facilityId} size={44} radius={10} />
              <span>
                <strong>{titleFor(c.shift)}</strong>
                <small>{fmtDay(c.shift.date, { day: 'numeric', month: 'short', year: 'numeric' })}</small>
              </span>
              <b>+{formatNaira(c.shift.rate)}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
