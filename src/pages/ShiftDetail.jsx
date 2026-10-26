import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getShift, claimShift } from '../lib/shifts';
import { getFacility } from '../lib/facility';
import { useAuth } from '../context/AuthContext';
import { getOrCreateConversation } from '../lib/chat';
import { formatNaira, perHour, fmtDay, fmtRange, shiftType, titleFor } from '../lib/earnings';
import MapModal from '../components/MapModal';
import Icon from '../components/ns/Icon';
import FacilityThumb from '../components/ns/FacilityThumb';
import PhoneLink from '../components/ns/PhoneLink';

export default function ShiftDetail() {
  const { shiftId } = useParams();
  const navigate = useNavigate();
  const { nurse } = useAuth();
  const [shift, setShift] = useState(null);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [error, setError] = useState(null);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    getShift(shiftId).then((data) => {
      setShift(data);
      setLoading(false);
      if (data?.facilityId) getFacility(data.facilityId).then(setFacility);
    });
  }, [shiftId]);

  async function handleClaim() {
    setClaiming(true);
    setError(null);
    try {
      await claimShift(shiftId, nurse.id);
      setClaimed(true);
    } catch (err) {
      setError(err?.message ?? 'Could not claim this shift. Try again.');
    } finally {
      setClaiming(false);
    }
  }

  async function handleMessage() {
    setMessaging(true);
    setError(null);
    try {
      const conv = await getOrCreateConversation(
        { id: nurse.id, type: 'nurse', name: nurse.name },
        { id: shift.facilityId, type: 'facility', name: shift.facility },
        { type: 'shift', shiftId: shift.id }
      );
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setMessaging(false);
    }
  }

  if (loading) return <div className="ns-screen"><div className="ns-empty">Loading...</div></div>;
  if (!shift) {
    return (
      <div className="ns-screen">
        <div className="ns-empty">Shift not found.</div>
        <Link to="/shifts" className="ns-btn ns-btn-outline ns-btn-block">Back to shifts</Link>
      </div>
    );
  }

  const isVerified = nurse?.verification === 'verified';
  const isOpen = shift.status === 'open' && !claimed && isVerified;
  const hr = perHour(shift.rate, shift.hours);
  const cover = coverFailed ? null : facility?.photos?.[0]?.url ?? facility?.photoUrl ?? null;
  const facilityVerified = facility?.verification === 'verified' || facility?.status === 'verified';
  const rating =
    facility?.rating != null
      ? `${facility.rating.toFixed(1)} (${facility.ratingCount} review${facility.ratingCount === 1 ? '' : 's'})`
      : shift.facilityRating != null
      ? shift.facilityRating.toFixed(1)
      : 'Not yet rated';

  const rows = [
    { icon: 'briefcase', label: 'Department', value: shift.unit },
    { icon: shiftType(shift.start) === 'Day Shift' ? 'sun' : 'moon', label: 'Shift Type', value: shiftType(shift.start) },
    { icon: 'user', label: 'Required Cadre', value: shift.cadre },
    { icon: 'clock', label: 'Time', value: `${fmtRange(shift)}` },
    { icon: 'star', label: 'Facility Rating', value: rating },
    { icon: 'file', label: 'Shift Code', value: shift.id },
    { icon: 'phone', label: 'Phone', value: <PhoneLink phone={facility?.phone} /> },
  ];

  return (
    <div className="ns-detail">
      <div className={`ns-detail-hero${cover ? ' has-photo' : ''}`}>
        {cover && <img className="ns-detail-photo" src={cover} alt={`${shift.facility}`} onError={() => setCoverFailed(true)} />}
        <div className="ns-detail-bar">
          <button type="button" className="ns-icon-btn glass" onClick={() => navigate(-1)} aria-label="Back">
            <Icon name="back" size={22} />
          </button>
          <button
            type="button"
            className={`ns-icon-btn glass${saved ? ' liked' : ''}`}
            onClick={() => setSaved((s) => !s)}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from saved' : 'Save shift'}
          >
            <Icon name="heart" size={20} fill={saved ? 'currentColor' : 'none'} />
          </button>
        </div>
        {!cover && <Icon name="building" size={120} strokeWidth={1} className="ns-detail-art" />}
        {facilityVerified && (
          <span className="ns-verified-chip"><Icon name="shieldCheck" size={14} /> Verified Facility</span>
        )}
      </div>

      <div className="ns-detail-sheet">
        <div className="ns-detail-title">
          <FacilityThumb seed={shift.facilityId ?? shift.facility} photo={cover} size={44} radius={10} />
          <div>
            <h1>{titleFor(shift)}</h1>
            <p><Icon name="building" size={13} /> {shift.facility}</p>
            <MapModal lat={shift.lat} lng={shift.lng} label={shift.facility} city={shift.city} className="ns-map-link">
              <Icon name="pin" size={13} /> {shift.city} · View on map
            </MapModal>
          </div>
        </div>

        <div className="ns-two">
          <div className="ns-mini">
            <Icon name="calendar" size={20} />
            <span><small>Starts</small><strong>{fmtDay(shift.date)}</strong></span>
          </div>
          <div className="ns-mini">
            <Icon name="clock" size={20} />
            <span><small>Duration</small><strong>{shift.hours} hours</strong></span>
          </div>
        </div>

        <div className="ns-price">
          <strong>{formatNaira(shift.rate)}</strong>
          {hr && <small>({formatNaira(hr)}/hr)</small>}
        </div>

        <h2 className="ns-h2">Shift Details</h2>
        <dl className="ns-rows">
          {rows.map((r) => (
            <div key={r.label}>
              <dt><Icon name={r.icon} size={16} /> {r.label}:</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>

        {!isVerified && shift.status === 'open' && (
          <p className="ns-note">Your license is still under review. You can claim shifts once it is verified.</p>
        )}
        {error && <p className="ns-error">{error}</p>}

        <button type="button" className="ns-btn ns-btn-outline ns-btn-block" disabled={messaging} onClick={handleMessage}>
          <Icon name="message" size={18} /> {messaging ? 'Opening...' : `Message ${shift.facility}`}
        </button>
      </div>

      <div className="ns-cta">
        <button type="button" className="ns-btn ns-btn-green ns-btn-block" disabled={!isOpen || claiming} onClick={handleClaim}>
          {claiming
            ? 'Claiming...'
            : claimed
            ? 'Claimed'
            : !isVerified
            ? 'License pending review'
            : isOpen
            ? <>Claim Shift <Icon name="arrowRight" size={18} /></>
            : 'No longer available'}
        </button>
      </div>

      {claimed && (
        <div className="ns-success" role="alertdialog" aria-labelledby="claimed-title">
          <div className="ns-confetti" aria-hidden="true">
            {Array.from({ length: 14 }).map((_, i) => <i key={i} style={{ '--i': i }} />)}
          </div>
          <div className="ns-success-badge"><Icon name="check" size={56} strokeWidth={3} /></div>
          <h1 id="claimed-title">Shift Claimed!</h1>
          <p>Your shift has been successfully claimed. You'll receive updates from the facility soon.</p>
          <div className="ns-card ns-success-card">
            <FacilityThumb seed={shift.facilityId ?? shift.facility} photo={cover} size={60} radius={10} />
            <div>
              <strong>{titleFor(shift)}</strong>
              <p><Icon name="pin" size={13} /> {shift.facility}</p>
              <p><Icon name="calendar" size={13} /> {fmtDay(shift.date)}, {fmtRange(shift).split(' - ')[0]}</p>
              <b>{formatNaira(shift.rate)}</b>
            </div>
          </div>
          <Link to="/my-shifts" className="ns-btn ns-btn-green ns-btn-block">View My Shifts</Link>
          <Link to="/" className="ns-btn ns-btn-ghost ns-btn-block">Back to Home</Link>
        </div>
      )}
    </div>
  );
}
