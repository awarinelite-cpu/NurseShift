import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listMyClaims, clockIn, clockOut } from '../lib/shifts';
import { rateFacilityForClaim } from '../lib/ratings';
import { fileDispute } from '../lib/disputes';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation } from '../lib/chat';
import Badge from '../components/Badge';
import ReportIssueForm from '../components/ReportIssueForm';

function formatNaira(amount) {
  return `₦${(amount ?? 0).toLocaleString('en-NG')}`;
}

export default function MyShifts() {
  const { nurse } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(null);
  const [messageError, setMessageError] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);
  const [reportingFor, setReportingFor] = useState(null);
  const [reportSent, setReportSent] = useState(null);

  async function refresh() {
    const data = await listMyClaims(nurse.id);
    setClaims(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClockIn(claimId) {
    await clockIn(claimId);
    refresh();
  }

  async function handleClockOut(claimId) {
    await clockOut(claimId);
    refresh();
  }

  async function handleRate(claim, rating) {
    await rateFacilityForClaim(claim.id, claim.shift?.facilityId, rating);
    setRatingFor(null);
    refresh();
  }

  async function handleReport(claim, { reason, description }) {
    await fileDispute({
      claimId: claim.id,
      shiftId: claim.shiftId,
      facilityId: claim.shift?.facilityId,
      nurseId: nurse.id,
      reporterId: nurse.id,
      reporterRole: 'nurse',
      reporterName: nurse.name,
      otherPartyName: claim.shift?.facility ?? 'Unknown facility',
      shiftLabel: `${claim.shift?.unit ?? ''} · ${claim.shift?.date ?? ''}`.trim(),
      reason,
      description,
    });
    setReportingFor(null);
    setReportSent(claim.id);
    refresh();
  }

  async function handleMessage(c) {
    setMessaging(c.id);
    setMessageError(null);
    try {
      const conv = await getOrCreateConversation(
        { id: nurse.id, type: 'nurse', name: nurse.name },
        { id: c.shift?.facilityId, type: 'facility', name: c.shift?.facility },
        { type: 'shift', shiftId: c.shiftId }
      );
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setMessaging(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">{claims.length} claimed</p>
        <h1 className="page-title">My Shifts</h1>
        <p className="page-sub">Track approvals, clock in when your shift starts, and clock out when it ends.</p>
      </div>

      {messageError && <p className="form-error" style={{ marginBottom: 16 }}>{messageError}</p>}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          You haven't claimed any shifts yet. Head to the Duty Board to find one.
        </div>
      ) : (
        claims.map((c) => {
          const canRate = c.status === 'completed' && !c.facilityRated;
          const alreadyReported = c.disputeFiled || reportSent === c.id;
          return (
            <div className="claim-card" key={c.id} style={{ flexWrap: 'wrap' }}>
              <div>
                <div className="facility">{c.shift?.facility ?? 'Unknown facility'}</div>
                <div className="meta">
                  {c.shift?.unit} · {c.shift?.date} · {c.shift?.start}–{c.shift?.end} · {formatNaira(c.shift?.rate ?? 0)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Badge status={c.status}>{c.status}</Badge>
                <button className="clock-btn" disabled={messaging === c.id} onClick={() => handleMessage(c)}>
                  {messaging === c.id ? 'Opening…' : 'Message'}
                </button>
                {c.status === 'approved' && !c.clockIn && (
                  <button className="clock-btn" onClick={() => handleClockIn(c.id)}>Clock in</button>
                )}
                {c.clockIn && !c.clockOut && (
                  <button className="clock-btn active" onClick={() => handleClockOut(c.id)}>Clock out</button>
                )}
                {c.clockOut && <Badge status="completed">Completed</Badge>}
                {canRate && ratingFor !== c.id && (
                  <button className="clock-btn" onClick={() => setRatingFor(c.id)}>Rate this facility</button>
                )}
                {!alreadyReported && reportingFor !== c.id && (
                  <button
                    className="clock-btn"
                    style={{ color: 'var(--red)' }}
                    onClick={() => setReportingFor(c.id)}
                  >
                    Report an issue
                  </button>
                )}
                {alreadyReported && <span style={{ fontSize: 12.5, color: 'var(--slate)' }}>Reported — under review</span>}
              </div>

              {canRate && ratingFor === c.id && (
                <div style={{ display: 'flex', gap: 4, width: '100%', marginTop: 12 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} className="clock-btn" onClick={() => handleRate(c, n)}>
                      {n} ★
                    </button>
                  ))}
                </div>
              )}

              {reportingFor === c.id && (
                <ReportIssueForm
                  onSubmit={(payload) => handleReport(c, payload)}
                  onCancel={() => setReportingFor(null)}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
