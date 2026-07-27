import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOpenShifts } from '../lib/shifts';
import Badge from '../components/Badge';

const UNITS = ['All units', 'ICU', 'Accident & Emergency', 'Labour Ward', 'Paediatrics', 'Theatre', 'General Medicine'];

function formatNaira(amount) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function ShiftBoard() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unitFilter, setUnitFilter] = useState('All units');

  useEffect(() => {
    listOpenShifts().then((data) => {
      setShifts(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (unitFilter === 'All units') return shifts;
    return shifts.filter((s) => s.unit === unitFilter);
  }, [shifts, unitFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">{filtered.filter((s) => s.status === 'open').length} shifts open</p>
        <h1 className="page-title">Duty Board</h1>
        <p className="page-sub">Claim a shift and it moves to pending until the facility approves you.</p>
      </div>

      <div className="filter-bar">
        {UNITS.map((u) => (
          <button
            key={u}
            className={`filter-chip ${unitFilter === u ? 'active' : ''}`}
            onClick={() => setUnitFilter(u)}
          >
            {u}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading shifts…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No shifts match this filter yet. Try another unit.</div>
      ) : (
        <div className="duty-board">
          <div className="board-row header">
            <div>Code</div>
            <div>Facility / Unit</div>
            <div>Time</div>
            <div>Rate</div>
            <div>Status</div>
            <div></div>
          </div>
          {filtered.map((s, i) => (
            <Link
              to={`/shifts/${s.id}`}
              key={s.id}
              className={`board-row ${s.status === 'filled' ? 'filled' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="board-code">{s.id}</div>
              <div className="board-main">
                <div className="facility">{s.facility}</div>
                <div className="meta">{s.unit} · {s.city} · {s.cadre}</div>
              </div>
              <div className="board-time">
                {s.start}–{s.end}
                <div className="date">{formatDate(s.date)}</div>
              </div>
              <div className="board-rate">{formatNaira(s.rate)}</div>
              <div>
                {s.urgency === 'urgent' && s.status === 'open' ? (
                  <Badge status="urgent">Closes soon</Badge>
                ) : (
                  <Badge status={s.status}>{s.status}</Badge>
                )}
              </div>
              <div className="board-arrow">→</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
