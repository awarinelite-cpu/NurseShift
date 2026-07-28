import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getShift, claimShift } from '../lib/shifts';
import { getFacility } from '../lib/facility';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation } from '../lib/chat';
import Badge from '../components/Badge';
import MapModal from '../components/MapModal';

function formatNaira(amount) {
  return `₦${(amount ?? 0).toLocaleString('en-NG')}`;
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ShiftDetail() {
  const { shiftId } = useParams();
  const navigate = useNavigate();
  const { nurse } = useAuth();
  const [shift, setShift] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [messageError, setMessageError] = useState(null);

  useEffect(() => {
    getShift(shiftId).then((data) => {
      setShift(data);
      setLoading(false);
      if (data?.facilityId) getFacility(data.facilityId).then(setFacility);
    });
  }, [shiftId]);

  async function handleClaim() {
    setClaiming(true);
    await claimShift(shiftId, nurse.id);
    setClaiming(false);
    setClaimed(true);
  }

  async function handleMessage() {
    setMessaging(true);
    setMessageError(null);
    try {
      const conv = await getOrCreateConversation(
        { id: nurse.id, type: 'nurse', name: nurse.name },
        { id: shift.facilityId, type: 'facility', name: shift.facility },
        { type: 'shift', shiftId: shift.id }
      );
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setMessaging(false);
    }
  }

  if (loading) return <div className="page"><div className="empty-state">Loading…</div></div>;
  if (!shift) return <div className="page"><div className="empty-state">Shift not found.</div></div>;

  const isVerified = nurse?.verification === 'verified';
  const isOpen = shift.status === 'open' && !claimed && isVerified;

  return (
    <div className="page">
      <Link to="/" className="back-link">← Back to duty board</Link>

      <div className="detail-card">
        <div className="detail-top">
          <div>
            <p className="detail-facility">{shift.facility}</p>
            <MapModal
              lat={shift.lat}
              lng={shift.lng}
              label={shift.facility}
              city={shift.city}
              className="detail-city"
              style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {shift.unit} · {shift.city} · 📍 View on map
            </MapModal>
          </div>
          {claimed ? (
            <Badge status="pending">Pending approval</Badge>
          ) : (
            <Badge status={shift.status}>{shift.status}</Badge>
          )}
        </div>

        <div className="detail-grid">
          <div className="detail-stat">
            <p className="label">Date</p>
            <p className="value">{formatDateFull(shift.date)}</p>
          </div>
          <div className="detail-stat">
            <p className="label">Time</p>
            <p className="value">{shift.start} – {shift.end} ({shift.hours}h)</p>
          </div>
          <div className="detail-stat">
            <p className="label">Rate</p>
            <p className="value">{formatNaira(shift.rate)}</p>
          </div>
          <div className="detail-stat">
            <p className="label">Cadre required</p>
            <p className="value">{shift.cadre}</p>
          </div>
          <div className="detail-stat">
            <p className="label">Shift code</p>
            <p className="value">{shift.id}</p>
          </div>
          <div className="detail-stat">
            <p className="label">Facility rating</p>
            <p className="value">
              {facility?.rating != null
                ? `★ ${facility.rating.toFixed(1)} (${facility.ratingCount} review${facility.ratingCount === 1 ? '' : 's'})`
                : shift.facilityRating != null
                ? `★ ${shift.facilityRating.toFixed(1)}`
                : 'Not yet rated'}
            </p>
          </div>
        </div>

        {claimed ? (
          <p style={{ color: 'var(--slate)', fontSize: 13.5, margin: '0 0 12px' }}>
            Your claim is in. {shift.facility} will approve or decline it — check My Shifts for updates.
          </p>
        ) : !isVerified && shift.status === 'open' ? (
          <p style={{ color: 'var(--slate)', fontSize: 13.5, margin: '0 0 12px' }}>
            Your license is still under review — you can claim shifts once it's verified.
          </p>
        ) : null}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            className="claim-btn"
            style={{ flex: '1 1 160px', minWidth: 0 }}
            disabled={!isOpen || claiming}
            onClick={handleClaim}
          >
            {claiming
              ? 'Claiming…'
              : claimed
              ? 'Claimed'
              : !isVerified
              ? 'License pending review'
              : isOpen
              ? 'Claim this shift'
              : 'No longer available'}
          </button>
          <button
            type="button"
            className="claim-btn"
            style={{ background: 'var(--ink-soft)', flex: '1 1 160px', minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}
            disabled={messaging}
            onClick={handleMessage}
          >
            {messaging ? 'Opening…' : `Message ${shift.facility}`}
          </button>
          {messageError && <p className="form-error" style={{ width: '100%' }}>{messageError}</p>}
        </div>

        {claimed && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link to="/my-shifts" style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>
              View in My Shifts →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
