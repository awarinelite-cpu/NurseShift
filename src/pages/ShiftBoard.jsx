import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOpenShifts } from '../lib/shifts';
import { getCurrentLocation, distanceKm } from '../lib/geo';
import Badge from '../components/Badge';

const UNITS = ['All units', 'ICU', 'Accident & Emergency', 'Labour Ward', 'Paediatrics', 'Theatre', 'General Medicine'];

function formatNaira(amount) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDistance(km) {
  if (km == null) return null;
  if (km < 1) return '<1 km away';
  return `${Math.round(km)} km away`;
}

export default function ShiftBoard() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unitFilter, setUnitFilter] = useState('All units');
  const [userLoc, setUserLoc] = useState(null);
  const [locDenied, setLocDenied] = useState(false);

  useEffect(() => {
    listOpenShifts().then((data) => {
      setShifts(data);
      setLoading(false);
    });
    getCurrentLocation().then((loc) => {
      if (loc) setUserLoc(loc);
      else setLocDenied(true);
    });
  }, []);

  // Attach distance to each shift (null when either side is missing coordinates),
  // then sort closest-first — shifts with no known distance sink to the bottom
  // rather than being hidden, since the shift itself may still be worth taking.
  const withDistance = useMemo(() => {
    return shifts.map((s) => ({
      ...s,
      distanceKm:
        userLoc && s.lat != null && s.lng != null
          ? distanceKm(userLoc.lat, userLoc.lng, s.lat, s.lng)
          : null,
    }));
  }, [shifts, userLoc]);

  const filtered = useMemo(() => {
    const list = unitFilter === 'All units' ? withDistance : withDistance.filter((s) => s.unit === unitFilter);
    return [...list].sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [withDistance, unitFilter]);

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

      {locDenied && (
        <p className="page-sub" style={{ marginTop: -8, marginBottom: 16 }}>
          Turn on location access to see shifts sorted by distance from you.
        </p>
      )}

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
                <div className="meta">
                  {s.unit} · {s.city} · {s.cadre}
                  {formatDistance(s.distanceKm) && <> · {formatDistance(s.distanceKm)}</>}
                </div>
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
