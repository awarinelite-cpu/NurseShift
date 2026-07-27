import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getShift, claimShift } from '../lib/shifts';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';

function formatNaira(amount) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function formatDateFull(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Prefer exact coordinates when the facility set them; fall back to a text
// search of facility name + city so the link still works for older facilities
// that signed up before location capture existed.
function mapUrl(shift) {
  if (shift.lat != null && shift.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${shift.lat},${shift.lng}`;
  }
  const q = encodeURIComponent(`${shift.facility} ${shift.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function ShiftDetail() {
  const { shiftId } = useParams();
  const navigate = useNavigate();
  const { nurse } = useAuth();
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    getShift(shiftId).then((data) => {
      setShift(data);
      setLoading(false);
    });
  }, [shiftId]);

  async function handleClaim() {
    setClaiming(true);
    await claimShift(shiftId, nurse.id);
    setClaiming(false);
    setClaimed(true);
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
            <a
              href={mapUrl(shift)}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-city"
              style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {shift.unit} · {shift.city} · 📍 View on map
            </a>
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
            <p className="value">★ {shift.facilityRating.toFixed(1)}</p>
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

        <button
          className="claim-btn"
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
