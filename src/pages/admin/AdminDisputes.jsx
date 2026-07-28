import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listAllDisputes, resolveDispute } from '../../lib/disputes';
import { useAdmin } from '../../context/AdminContext';
import Badge from '../../components/Badge';

const TABS = [
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'all', label: 'All' },
];

function formatDate(value) {
  if (!value) return '';
  const d = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminDisputes() {
  const { signOut } = useAdmin();
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');
  const [actingOn, setActingOn] = useState(null);
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState('');

  async function refresh() {
    const data = await listAllDisputes();
    setDisputes(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  async function handleResolve(dispute, status) {
    setActingOn(dispute.id);
    await resolveDispute(dispute.id, status, note);
    setNote('');
    setNoteFor(null);
    await refresh();
    setActingOn(null);
  }

  const filtered = tab === 'all' ? disputes : disputes.filter((d) => d.status === tab);

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">{disputes.filter((d) => d.status === 'open').length} open</p>
          <h1 className="page-title">Disputes</h1>
          <p className="page-sub">Reports filed by nurses or facilities about a shift claim.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Link to="/admin" className="clock-btn" style={{ textDecoration: 'none' }}>Dashboard</Link>
          <button className="clock-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className="clock-btn"
            style={tab === t.key ? { background: 'var(--ink)', color: 'var(--surface)' } : undefined}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No {tab === 'all' ? '' : tab} disputes.</div>
      ) : (
        filtered.map((d) => (
          <div className="detail-card" key={d.id} style={{ marginBottom: 14 }}>
            <div className="detail-top">
              <div>
                <p className="detail-facility">{d.reason}</p>
                <p className="detail-city">
                  Filed by {d.reporterName} ({d.reporterRole}) against {d.otherPartyName}
                  {d.shiftLabel ? ` · ${d.shiftLabel}` : ''}
                  {formatDate(d.createdAt) ? ` · ${formatDate(d.createdAt)}` : ''}
                </p>
              </div>
              <Badge status={d.status === 'open' ? 'pending' : d.status}>{d.status}</Badge>
            </div>

            <p style={{ fontSize: 13.5, color: 'var(--ink)', margin: '0 0 16px', lineHeight: 1.5 }}>
              {d.description}
            </p>

            {d.status !== 'open' && d.resolutionNote && (
              <p style={{ fontSize: 12.5, color: 'var(--slate)', margin: '0 0 12px' }}>
                Resolution note: {d.resolutionNote}
              </p>
            )}

            {d.status === 'open' && (
              <>
                {noteFor === d.id ? (
                  <div className="form-row" style={{ marginBottom: 12 }}>
                    <label htmlFor={`note-${d.id}`}>Resolution note (optional)</label>
                    <textarea
                      id={`note-${d.id}`}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="What did you decide, and why?"
                    />
                  </div>
                ) : (
                  <button className="clock-btn" style={{ marginBottom: 12 }} onClick={() => setNoteFor(d.id)}>
                    Add a resolution note
                  </button>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    className="claim-btn"
                    style={{ background: 'var(--green)', flex: '1 1 140px' }}
                    disabled={actingOn === d.id}
                    onClick={() => handleResolve(d, 'resolved')}
                  >
                    Mark resolved
                  </button>
                  <button
                    className="claim-btn"
                    style={{ background: 'var(--ink-soft)', flex: '1 1 140px' }}
                    disabled={actingOn === d.id}
                    onClick={() => handleResolve(d, 'dismissed')}
                  >
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
