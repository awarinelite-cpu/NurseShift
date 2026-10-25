import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listOpenShifts } from '../lib/shifts';
import { getCurrentLocation, distanceKm } from '../lib/geo';
import { formatNaira, perHour, shiftType, titleFor } from '../lib/earnings';
import Icon from '../components/ns/Icon';
import FacilityThumb from '../components/ns/FacilityThumb';

const UNITS = ['All Specialities', 'ICU', 'Accident & Emergency', 'Labour Ward', 'Paediatrics', 'Theatre', 'General Medicine'];

function unitTone(unit = '') {
  if (/emergency|a&e|accident/i.test(unit)) return 'red';
  if (/labour|matern/i.test(unit)) return 'purple';
  return 'green';
}

function formatDistance(km) {
  if (km == null) return null;
  return km < 1 ? '<1 km away' : `${Math.round(km)} km away`;
}

export default function ShiftBoard() {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unitFilter, setUnitFilter] = useState('All Specialities');
  const [cityFilter, setCityFilter] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('nearest');
  const [userLoc, setUserLoc] = useState(null);
  const [locDenied, setLocDenied] = useState(false);

  useEffect(() => {
    listOpenShifts().then((data) => {
      setShifts(data);
      setLoading(false);
    });
    getCurrentLocation().then((loc) => {
      if (loc) setUserLoc(loc);
      else setLocDenied(true);
    });
  }, []);

  const cities = useMemo(() => [...new Set(shifts.map((s) => s.city).filter(Boolean))].sort(), [shifts]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = shifts
      .map((s) => ({
        ...s,
        distanceKm:
          userLoc && s.lat != null && s.lng != null ? distanceKm(userLoc.lat, userLoc.lng, s.lat, s.lng) : null,
      }))
      .filter((s) => unitFilter === 'All Specialities' || s.unit === unitFilter)
      .filter((s) => !cityFilter || s.city === cityFilter)
      .filter(
        (s) =>
          !q || [s.facility, s.city, s.unit, s.cadre, s.id].some((f) => String(f ?? '').toLowerCase().includes(q))
      );

    return list.sort((a, b) => {
      if (sortBy === 'pay') return (b.rate ?? 0) - (a.rate ?? 0);
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [shifts, userLoc, unitFilter, cityFilter, query, sortBy]);

  return (
    <div className="ns-screen">
      <header className="ns-topbar">
        <button type="button" className="ns-icon-btn" onClick={() => navigate('/')} aria-label="Back to home">
          <Icon name="back" size={22} />
        </button>
        <h1>Available Shifts</h1>
        <span className="ns-topbar-spacer" />
      </header>

      <label className="ns-search">
        <Icon name="search" size={18} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shifts, hospital, location..."
        />
      </label>

      <div className="ns-filters">
        <label className="ns-pill-select active">
          <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} aria-label="Speciality">
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
          <Icon name="chevD" size={16} />
        </label>
        <label className="ns-pill-select">
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} aria-label="Location">
            <option value="">Location</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
          <Icon name="chevD" size={16} />
        </label>
        <button
          type="button"
          className={`ns-icon-btn outlined${sortBy === 'pay' ? ' on' : ''}`}
          onClick={() => setSortBy((s) => (s === 'nearest' ? 'pay' : 'nearest'))}
          aria-label={sortBy === 'pay' ? 'Sorted by highest pay. Tap to sort by nearest' : 'Sorted by nearest. Tap to sort by highest pay'}
          title={sortBy === 'pay' ? 'Highest pay first' : 'Nearest first'}
        >
          <Icon name="sliders" size={18} />
        </button>
      </div>

      <p className="ns-sort-note">
        {sortBy === 'pay' ? 'Highest pay first' : locDenied ? 'Turn on location access to sort by distance' : 'Nearest first'}
      </p>

      {loading ? (
        <div className="ns-empty">Loading shifts...</div>
      ) : visible.length === 0 ? (
        <div className="ns-empty">No shifts match these filters yet. Try changing them.</div>
      ) : (
        <ul className="ns-list">
          {visible.map((s) => {
            const open = s.status === 'open';
            const hr = perHour(s.rate, s.hours);
            const day = shiftType(s.start) === 'Day Shift';
            return (
              <li key={s.id}>
                <Link to={`/shifts/${s.id}`} className={`ns-card ns-shift${open ? '' : ' muted'}`}>
                  <FacilityThumb seed={s.facilityId ?? s.facility} facilityId={s.facilityId} />
                  <div className="ns-shift-main">
                    <h3>{titleFor(s)}</h3>
                    <p><Icon name="building" size={13} /> {s.facility}</p>
                    <p><Icon name="pin" size={13} /> {s.city}{formatDistance(s.distanceKm) && `, ${formatDistance(s.distanceKm)}`}</p>
                  </div>
                  <div className="ns-shift-price">
                    <strong>{formatNaira(s.rate)}</strong>
                    {hr && <small>({formatNaira(hr)}/hr)</small>}
                    {open ? (
                      <span className="ns-btn ns-btn-green ns-btn-sm">Claim Shift <Icon name="arrowRight" size={14} /></span>
                    ) : (
                      <span className="ns-tag grey">{s.status === 'claimed' ? 'Claimed' : 'Filled'}</span>
                    )}
                  </div>
                  <div className="ns-tags">
                    <span className={`ns-tag ${unitTone(s.unit)}`}>{s.unit}</span>
                    <span className={`ns-tag ${day ? 'amber' : 'indigo'}`}>
                      <Icon name={day ? 'sun' : 'moon'} size={12} /> {shiftType(s.start)}
                    </span>
                    <span className="ns-tag plain"><Icon name="clock" size={12} /> {s.hours} hours</span>
                    {s.urgency === 'urgent' && open && <span className="ns-tag red">Closes soon</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
