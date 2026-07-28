import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFacility } from '../../context/FacilityContext';
import { listClaimsForFacility, approveClaim, rejectClaim, rateNurseForClaim } from '../../lib/facility';
import { getCurrentLocation } from '../../lib/geo';
import { getOrCreateConversation } from '../../lib/chat';
import Badge from '../../components/Badge';

function formatNaira(amount) {
  return `₦${(amount ?? 0).toLocaleString('en-NG')}`;
}

export default function FacilityDashboard() {
  const { facility, updateLocation } = useFacility();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);
  const [ratingFor, setRatingFor] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [messaging, setMessaging] = useState(null);

  async function refresh() {
    const data = await listClaimsForFacility(facility.id);
    setClaims(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove(claim) {
    setActingOn(claim.id);
    await approveClaim(claim.id, claim.shiftId);
    await refresh();
    setActingOn(null);
  }

  async function handleReject(claim) {
    setActingOn(claim.id);
    await rejectClaim(claim.id, claim.shiftId);
    await refresh();
    setActingOn(null);
  }

  async function handleRate(claim, rating) {
    setActingOn(claim.id);
    await rateNurseForClaim(claim.id, claim.nurseId, rating);
    await refresh();
    setActingOn(null);
    setRatingFor(null);
  }

  async function handleMessage(c) {
    setMessaging(c.id);
    const conv = await getOrCreateConversation(
      { id: facility.id, type: 'facility', name: facility.name },
      { id: c.nurseId, type: 'nurse', name: c.nurse?.name ?? 'Nurse' },
      { type: 'shift', shiftId: c.shiftId }
    );
    setMessaging(null);
    navigate(`/facility/messages/${conv.id}`);
  }

  async function handleUpdateLocation() {
    setLocating(true);
    setLocError('');
    const loc = await getCurrentLocation();
    setLocating(false);
    if (!loc) {
      setLocError('Could not get location — check your browser location permission and try again.');
      return;
    }
    await updateLocation(loc.lat, loc.lng);
  }

  const pending = claims.filter((c) => c.status === 'pending');
  const active = claims.filter((c) => c.status === 'approved');
  const toRate = claims.filter((c) => c.status === 'completed' && !c.rated);
  const done = claims.filter((c) => c.status === 'completed' && c.rated || c.status === 'rejected');

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">{facility?.name}</p>
        <h1 className="page-title">Claims</h1>
        <p className="page-sub">Approve a claim to lock in the nurse and lock the shift; rejecting reopens it.</p>
      </div>

      <div className="detail-card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <p className="detail-facility" style={{ fontSize: 14 }}>
            {facility?.lat != null ? '📍 Location set' : 'No location set'}
          </p>
          <p className="detail-city">
            {facility?.lat != null
              ? 'New shifts you post will show a distance and map link to nurses.'
              : 'Add your location so nurses can see distance and find you on the map.'}
          </p>
          {locError && <p className="form-error" style={{ marginTop: 6 }}>{locError}</p>}
        </div>
        <button className="clock-btn" onClick={handleUpdateLocation} disabled={locating}>
          {locating ? 'Getting location…' : facility?.lat != null ? 'Update location' : 'Set location'}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : claims.length === 0 ? (
        <div className="empty-state">No claims yet. Post a shift and nurses will start claiming it.</div>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginBottom: 10 }}>Awaiting your decision</p>
              {pending.map((c) => (
                <div className="detail-card" key={c.id} style={{ marginBottom: 14 }}>
                  <div className="detail-top">
                    <div>
                      <p className="detail-facility">{c.nurse?.name ?? 'Unknown nurse'}</p>
                      <p className="detail-city">
                        {c.nurse?.cadre} · {c.nurse?.specialty || 'General practice'} · {c.nurse?.yearsExperience} yrs
                        {c.nurse?.verification === 'verified' ? '' : ' · license not yet verified'}
                      </p>
                    </div>
                    <Badge status="pending">Pending</Badge>
                  </div>
                  <p style={{ fontSize: 13.5, color: 'var(--slate)', margin: '0 0 16px' }}>
                    Claiming {c.shift?.unit} · {c.shift?.date} · {c.shift?.start}–{c.shift?.end} · {formatNaira(c.shift?.rate)}
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="claim-btn" style={{ background: 'var(--green)' }} disabled={actingOn === c.id} onClick={() => handleApprove(c)}>
                      Approve
                    </button>
                    <button className="claim-btn" style={{ background: 'var(--red)' }} disabled={actingOn === c.id} onClick={() => handleReject(c)}>
                      Reject
                    </button>
                    <button className="claim-btn" style={{ background: 'var(--ink-soft)' }} disabled={messaging === c.id} onClick={() => handleMessage(c)}>
                      {messaging === c.id ? 'Opening…' : 'Message'}
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {active.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>Approved — upcoming or in progress</p>
              {active.map((c) => (
                <div className="claim-card" key={c.id}>
                  <div>
                    <div className="facility">{c.nurse?.name}</div>
                    <div className="meta">{c.shift?.unit} · {c.shift?.date} · {c.clockIn ? 'Clocked in' : 'Not clocked in yet'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="clock-btn" disabled={messaging === c.id} onClick={() => handleMessage(c)}>
                      {messaging === c.id ? 'Opening…' : 'Message'}
                    </button>
                    <Badge status="approved">Approved</Badge>
                  </div>
                </div>
              ))}
            </>
          )}

          {toRate.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>Completed — rate the nurse</p>
              {toRate.map((c) => (
                <div className="claim-card" key={c.id} style={{ flexWrap: 'wrap' }}>
                  <div>
                    <div className="facility">{c.nurse?.name}</div>
                    <div className="meta">{c.shift?.unit} · {c.shift?.date}</div>
                  </div>
                  {ratingFor === c.id ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} className="clock-btn" disabled={actingOn === c.id} onClick={() => handleRate(c, n)}>
                          {n} ★
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button className="clock-btn" onClick={() => setRatingFor(c.id)}>Rate nurse</button>
                  )}
                </div>
              ))}
            </>
          )}

          {done.length > 0 && (
            <>
              <p className="eyebrow" style={{ marginTop: 24, marginBottom: 10 }}>History</p>
              {done.map((c) => (
                <div className="claim-card" key={c.id}>
                  <div>
                    <div className="facility">{c.nurse?.name}</div>
                    <div className="meta">{c.shift?.unit} · {c.shift?.date}</div>
                  </div>
                  <Badge status={c.status}>{c.status}</Badge>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
