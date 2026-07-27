import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFacilityById } from '../../lib/admin';
import { listShiftsForFacility } from '../../lib/facility';
import Badge from '../../components/Badge';

function formatNaira(amount) {
  return `₦${(amount ?? 0).toLocaleString('en-NG')}`;
}

// Prefer exact coordinates when set; fall back to a text search of name + city.
function mapUrl(facility) {
  if (facility.lat != null && facility.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lng}`;
  }
  const q = encodeURIComponent(`${facility.name} ${facility.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function AdminFacilityDetail() {
  const { facilityId } = useParams();
  const [facility, setFacility] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
            <a
              href={mapUrl(facility)}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-city"
              style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {facility.city} · 📍 View on map
            </a>
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
            <p className="value" style={{ fontSize: 12.5, wordBreak: 'break-all' }}>{facility.id}</p>
          </div>
        </div>
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
