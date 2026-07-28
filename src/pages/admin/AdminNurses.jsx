import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listAllNursesForAdmin } from '../../lib/admin';
import { useAdmin } from '../../context/AdminContext';
import Badge from '../../components/Badge';

const FILTERS = [
  { key: 'all', label: 'All nurses' },
  { key: 'verified', label: 'Verified' },
  { key: 'active', label: 'Active right now' },
];

export default function AdminNurses() {
  const { signOut } = useAdmin();
  const navigate = useNavigate();
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

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">{filtered.length} nurse{filtered.length === 1 ? '' : 's'}</p>
          <h1 className="page-title">Nurses</h1>
          <p className="page-sub">Every nurse account on the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Link to="/admin" className="clock-btn" style={{ textDecoration: 'none' }}>Dashboard</Link>
          <button className="clock-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className="clock-btn"
            style={f.key === filter ? { background: 'var(--ink-soft)', color: '#fff' } : undefined}
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
          <div className="claim-card" key={n.id}>
            <div>
              <div className="facility">{n.name || 'Unnamed nurse'}</div>
              <div className="meta">
                {n.cadre || 'RN'}
                {n.specialty ? ` · ${n.specialty}` : ''}
                {n.email ? ` · ${n.email}` : ''}
                {n.phone ? ` · ${n.phone}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
