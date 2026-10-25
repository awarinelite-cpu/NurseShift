import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getFacilityById,
  addFacilityPhotos,
  removeFacilityPhoto,
  setFacilityCoverPhoto,
  MAX_FACILITY_PHOTOS,
} from '../../lib/admin';
import { listShiftsForFacility } from '../../lib/facility';
import Badge from '../../components/Badge';
import MapModal from '../../components/MapModal';

function formatNaira(amount) {
  return `₦${(amount ?? 0).toLocaleString('en-NG')}`;
}

export default function AdminFacilityDetail() {
  const { facilityId } = useParams();
  const [facility, setFacility] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    Promise.all([getFacilityById(facilityId), listShiftsForFacility(facilityId)]).then(
      ([facilityData, shiftData]) => {
        if (!facilityData) {
          setNotFound(true);
        } else {
          setFacility(facilityData);
          setShifts(shiftData);
        }
        setLoading(false);
      }
    );
  }, [facilityId]);

  const photos = facility?.photos ?? [];

  async function run(action) {
    setBusy(true);
    setPhotoError(null);
    try {
      const next = await action();
      setFacility((f) => ({ ...f, photos: next, photoUrl: next[0]?.url ?? null }));
    } catch (err) {
      setPhotoError(err?.message ?? 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function handlePick(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length) run(() => addFacilityPhotos(facilityId, files));
  }

  if (loading) return <div className="page"><div className="empty-state">Loading…</div></div>;
  if (notFound) return <div className="page"><div className="empty-state">Facility not found.</div></div>;

  return (
    <div className="page">
      <p style={{ marginBottom: 16 }}>
        <Link to="/admin/facilities">← Back to facilities</Link>
      </p>

      <div className="detail-card" style={{ marginBottom: 20 }}>
        <div className="detail-top">
          <div>
            <p className="detail-facility">{facility.name}</p>
            <MapModal
              lat={facility.lat}
              lng={facility.lng}
              label={facility.name}
              city={facility.city}
              className="detail-city"
              style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {facility.city} · 📍 View on map
            </MapModal>
          </div>
        </div>

        <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="detail-stat">
            <p className="label">Coordinates</p>
            <p className="value">
              {facility.lat != null && facility.lng != null ? `${facility.lat}, ${facility.lng}` : 'Not set'}
            </p>
          </div>
          <div className="detail-stat">
            <p className="label">Facility ID</p>
            <p className="value" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>{facility.id}</p>
          </div>
        </div>
      </div>

      <div className="detail-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p className="detail-facility" style={{ fontSize: '1rem' }}>Photos</p>
            <p className="label" style={{ marginTop: 2 }}>
              {photos.length} of {MAX_FACILITY_PHOTOS} · the first photo is the cover nurses see
            </p>
          </div>
          <button
            type="button"
            className="clock-btn active"
            disabled={busy || photos.length >= MAX_FACILITY_PHOTOS}
            onClick={() => fileInput.current?.click()}
          >
            {busy ? 'Working…' : 'Add photos'}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handlePick}
          />
        </div>

        {photoError && <p className="form-error" role="alert" style={{ marginTop: 10 }}>{photoError}</p>}

        {photos.length === 0 ? (
          <div className="photo-empty">No photos yet. Add a clear picture of the building or entrance.</div>
        ) : (
          <div className="photo-grid">
            {photos.map((p, i) => (
              <div className="photo-tile" key={p.url}>
                <img src={p.url} alt={`${facility.name} photo ${i + 1}`} loading="lazy" />
                {i === 0 && <span className="photo-badge">Cover</span>}
                <div className="photo-actions">
                  {i !== 0 && (
                    <button type="button" disabled={busy} onClick={() => run(() => setFacilityCoverPhoto(facilityId, p.url))}>
                      Make cover
                    </button>
                  )}
                  <button
                    type="button"
                    className="danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm('Remove this photo?')) run(() => removeFacilityPhoto(facilityId, p.url));
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="eyebrow" style={{ marginBottom: 10 }}>
        {shifts.length} shift{shifts.length === 1 ? '' : 's'} posted
      </p>

      {shifts.length === 0 ? (
        <div className="empty-state">No shifts posted for this facility yet.</div>
      ) : (
        shifts.map((s) => (
          <div className="claim-card" key={s.id}>
            <div>
              <div className="facility">{s.unit} · {s.date}</div>
              <div className="meta">
                {s.start}–{s.end} ({s.hours}h) · {s.cadre} · {formatNaira(s.rate)}
                {s.urgency === 'urgent' ? ' · urgent' : ''}
              </div>
            </div>
            <Badge status={s.status}>{s.status}</Badge>
          </div>
        ))
      )}
    </div>
  );
}
