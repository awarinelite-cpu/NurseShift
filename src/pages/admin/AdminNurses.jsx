import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listAllNursesForAdmin } from '../../lib/admin';
import Badge from '../../components/Badge';
import PageHero from '../../components/ns/PageHero';

const FILTERS = [
  { key: 'all', label: 'All nurses' },
  { key: 'verified', label: 'Verified' },
  { key: 'active', label: 'Active right now' },
];

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'N';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function AdminNurses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = FILTERS.some((f) => f.key === searchParams.get('filter')) ? searchParams.get('filter') : 'all';
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listAllNursesForAdmin()
      .then((data) => {
        if (!cancelled) setNurses(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load nurses.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'verified') return nurses.filter((n) => n.verification === 'verified');
    if (filter === 'active') return nurses.filter((n) => n.active);
    return nurses;
  }, [nurses, filter]);


  return (
    <div className="page">
      <PageHero
        title="Nurses"
        subtitle={`${filtered.length} nurse${filtered.length === 1 ? '' : 's'} · Every nurse account on the platform.`}
        tiles={loading || error ? [] : [
          { label: 'Total', value: nurses.length, tone: 'teal', icon: 'users' },
          { label: 'Verified', value: nurses.filter((n) => n.verification === 'verified').length, tone: 'blue', icon: 'shieldCheck' },
          { label: 'Active now', value: nurses.filter((n) => n.active).length, tone: 'green', icon: 'check' },
        ]}
      />

      <div className="nsd-filters">
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
        <div className="empty-state">No nurses match this filter.</div>
      ) : (
        filtered.map((n) => (
          <div className="claim-card nsd-row" key={n.id}>
            <span className="nsd-row-avatar" aria-hidden="true">{initials(n.name)}</span>
            <div className="nsd-row-main">
              <div className="facility">{n.name || 'Unnamed nurse'}</div>
              <div className="meta">
                {n.cadre || 'RN'}
                {n.specialty ? ` · ${n.specialty}` : ''}
                {n.email ? ` · ${n.email}` : ''}
                {n.phone ? ` · ${n.phone}` : ''}
              </div>
            </div>
            <div className="nsd-row-badges">
              {n.active && <Badge status="approved">Active now</Badge>}
              <Badge status={n.verification === 'verified' ? 'approved' : n.verification === 'rejected' ? 'rejected' : 'pending'}>
                {n.verification || 'pending'}
              </Badge>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
