import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listAllShiftsForAdmin } from '../../lib/admin';
import Badge from '../../components/Badge';

const FILTERS = [
  { key: 'all', label: 'All shifts' },
  { key: 'taken', label: 'Taken' },
  { key: 'open', label: 'Not taken' },
];

function isTaken(shift) {
  return !!shift.status && shift.status !== 'open';
}

function formatNaira(amount) {
  return `₦${(amount ?? 0).toLocaleString('en-NG')}`;
}

export default function AdminShifts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS.some((f) => f.key === searchParams.get('filter')) ? searchParams.get('filter') : 'all';
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAllShiftsForAdmin()
      .then((data) => {
        if (!cancelled) setShifts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load shifts.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'taken') return shifts.filter(isTaken);
    if (filter === 'open') return shifts.filter((s) => !isTaken(s));
    return shifts;
  }, [shifts, filter]);


  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">{filtered.length} shift{filtered.length === 1 ? '' : 's'}</p>
          <h1 className="page-title">Shifts</h1>
          <p className="page-sub">Every shift posted across all facilities.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`clock-btn${f.key === filter ? ' active' : ''}`}
            onClick={() => setSearchParams(f.key === 'all' ? {} : { filter: f.key })}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No shifts match this filter.</div>
      ) : (
        filtered.map((s) => (
          <div className="claim-card" key={s.id}>
            <div>
              <div className="facility">{s.facility || 'Unknown facility'}</div>
              <div className="meta">
                {s.unit} · {s.date} · {s.start}–{s.end} · {formatNaira(s.rate)} · {s.city}
              </div>
            </div>
            <Badge status={isTaken(s) ? 'approved' : 'pending'}>{isTaken(s) ? (s.status || 'taken') : 'open'}</Badge>
          </div>
        ))
      )}
    </div>
  );
}
