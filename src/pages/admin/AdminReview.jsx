import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { listNursesByStatus, setNurseVerification } from '../../lib/admin';
import { useAdmin } from '../../context/AdminContext';
import Badge from '../../components/Badge';

export default function AdminReview() {
  const { signOut } = useAdmin();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);
  const [decided, setDecided] = useState([]); // nurses just actioned this session, kept visible with their new status

  async function refresh() {
    const data = await listNursesByStatus('pending');
    setPending(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDecision(nurse, verification) {
    setActingOn(nurse.id);
    await setNurseVerification(nurse.id, verification);
    setDecided((d) => [{ ...nurse, verification }, ...d]);
    setPending((p) => p.filter((n) => n.id !== nurse.id));
    setActingOn(null);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">{pending.length} awaiting review</p>
          <h1 className="page-title">License Review</h1>
          <p className="page-sub">Check the license document against the number and name before approving.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Link to="/admin" className="clock-btn" style={{ textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/admin/facilities" className="clock-btn" style={{ textDecoration: 'none' }}>Facilities</Link>
          <button className="clock-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : pending.length === 0 && decided.length === 0 ? (
        <div className="empty-state">No pending licenses. New sign-ups will show up here.</div>
      ) : (
        <>
          {pending.map((nurse) => (
            <div className="detail-card" key={nurse.id} style={{ marginBottom: 14 }}>
              <div className="detail-top">
                <div>
                  <p className="detail-facility">{nurse.name}</p>
                  <p className="detail-city">{nurse.cadre} · {nurse.specialty || 'General practice'} · {nurse.yearsExperience} yrs</p>
                </div>
                <Badge status="pending">Pending</Badge>
              </div>

              <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="detail-stat">
                  <p className="label">License number</p>
                  <p className="value">{nurse.licenseNumber}</p>
                </div>
                <div className="detail-stat">
                  <p className="label">License document</p>
                  <p className="value">
                    {nurse.licenseFileUrl ? (
                      <a href={nurse.licenseFileUrl} target="_blank" rel="noreferrer">{nurse.licenseFileName}</a>
                    ) : (
                      nurse.licenseFileName || 'Not provided'
                    )}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="claim-btn"
                  style={{ background: 'var(--green)' }}
                  disabled={actingOn === nurse.id}
                  onClick={() => handleDecision(nurse, 'verified')}
                >
                  Approve
                </button>
                <button
                  className="claim-btn"
                  style={{ background: 'var(--red)' }}
                  disabled={actingOn === nurse.id}
                  onClick={() => handleDecision(nurse, 'rejected')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {decided.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 24 }}>Decided this session</p>
              {decided.map((nurse) => (
                <div className="claim-card" key={nurse.id}>
                  <div>
                    <div className="facility">{nurse.name}</div>
                    <div className="meta">{nurse.licenseNumber}</div>
                  </div>
                  <Badge status={nurse.verification}>{nurse.verification}</Badge>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
