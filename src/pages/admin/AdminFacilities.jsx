import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listFacilitiesForAdmin, createFacility, fixSeedFacilityCoordinates } from '../../lib/admin';
import { useAdmin } from '../../context/AdminContext';

const EMPTY_FORM = {
  name: '',
  city: '',
  lat: '',
  lng: '',
  unit: '',
  cadre: 'RN',
  date: '',
  start: '07:00',
  end: '19:00',
  hours: '12',
  rate: '',
  urgency: 'normal',
};

export default function AdminFacilities() {
  const { signOut } = useAdmin();
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fixingCoords, setFixingCoords] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [fixError, setFixError] = useState('');

  async function refresh() {
    setLoading(true);
    const data = await listFacilitiesForAdmin();
    setFacilities(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.city.trim()) {
      setFormError('Name and city are required.');
      return;
    }
    setSaving(true);
    try {
      await createFacility(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await refresh();
    } catch (err) {
      setFormError(err.message || 'Could not create facility.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login');
  }

  async function handleFixCoordinates() {
    setFixingCoords(true);
    setFixError('');
    setFixResult(null);
    try {
      const result = await fixSeedFacilityCoordinates();
      setFixResult(result);
      await refresh();
    } catch (err) {
      setFixError(err.message || 'Could not fix coordinates.');
    } finally {
      setFixingCoords(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow">{facilities.length} facilities</p>
          <h1 className="page-title">Facilities</h1>
          <p className="page-sub">Review registered facilities, add one, or bulk-import a list.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Link to="/admin" className="clock-btn" style={{ textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/admin/disputes" className="clock-btn" style={{ textDecoration: 'none' }}>Disputes</Link>
          <button className="clock-btn" onClick={handleSignOut}>Sign out</button>
        </div>
      </div>

      <p style={{ marginBottom: 16 }}>
        <Link to="/admin/review">← Back to license review</Link>
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="claim-btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add facility'}
        </button>
        <Link to="/admin/facilities/import" className="clock-btn" style={{ textDecoration: 'none' }}>
          Bulk import CSV
        </Link>
        <button className="clock-btn" onClick={handleFixCoordinates} disabled={fixingCoords}>
          {fixingCoords ? 'Fixing coordinates…' : 'Fix seed facility coordinates'}
        </button>
      </div>

      {fixResult && (
        <p className="detail-city" style={{ marginBottom: 20 }}>
          Updated {fixResult.facilitiesUpdated} facilit{fixResult.facilitiesUpdated === 1 ? 'y' : 'ies'} and{' '}
          {fixResult.shiftsUpdated} shift{fixResult.shiftsUpdated === 1 ? '' : 's'}
          {fixResult.facilitiesSkipped > 0 ? ` (${fixResult.facilitiesSkipped} seed facilities not found in Firestore, skipped)` : ''}.
        </p>
      )}
      {fixError && (
        <p className="form-error" style={{ marginBottom: 20 }}>{fixError}</p>
      )}

      {showForm && (
        <form className="detail-card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="f-name">Facility name</label>
            <input id="f-name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="form-row">
            <label htmlFor="f-city">City / LGA, State</label>
            <input id="f-city" placeholder="e.g. Ikeja, Lagos" value={form.city} onChange={(e) => update('city', e.target.value)} required />
          </div>
          <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-row">
              <label htmlFor="f-lat">Latitude</label>
              <input id="f-lat" type="number" step="any" value={form.lat} onChange={(e) => update('lat', e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="f-lng">Longitude</label>
              <input id="f-lng" type="number" step="any" value={form.lng} onChange={(e) => update('lng', e.target.value)} />
            </div>
          </div>

          <p className="label" style={{ marginTop: 4 }}>Optional — post one shift for this facility now</p>

          <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-row">
              <label htmlFor="f-unit">Unit</label>
              <input id="f-unit" placeholder="e.g. ICU" value={form.unit} onChange={(e) => update('unit', e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="f-cadre">Cadre</label>
              <select id="f-cadre" value={form.cadre} onChange={(e) => update('cadre', e.target.value)}>
                <option value="RN">RN</option>
                <option value="RM">RM</option>
              </select>
            </div>
          </div>

          <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="form-row">
              <label htmlFor="f-date">Date</label>
              <input id="f-date" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="f-urgency">Urgency</label>
              <select id="f-urgency" value={form.urgency} onChange={(e) => update('urgency', e.target.value)}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="form-row">
              <label htmlFor="f-start">Start</label>
              <input id="f-start" type="time" value={form.start} onChange={(e) => update('start', e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="f-end">End</label>
              <input id="f-end" type="time" value={form.end} onChange={(e) => update('end', e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="f-hours">Hours</label>
              <input id="f-hours" type="number" value={form.hours} onChange={(e) => update('hours', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="f-rate">Rate (₦)</label>
            <input id="f-rate" type="number" placeholder="e.g. 8000" value={form.rate} onChange={(e) => update('rate', e.target.value)} />
          </div>

          {formError && <p className="form-error">{formError}</p>}

          <button className="claim-btn" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Create facility'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : facilities.length === 0 ? (
        <div className="empty-state">No facilities yet. Add one or bulk-import a CSV.</div>
      ) : (
        facilities.map((f) => (
          <Link to={`/admin/facilities/${f.id}`} className="claim-card" key={f.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div>
              <div className="facility">{f.name}</div>
              <div className="meta">
                {f.city} · {f.shiftCount} shift{f.shiftCount === 1 ? '' : 's'}
                {f.lat != null && f.lng != null ? ` · ${f.lat}, ${f.lng}` : ' · no location set'}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
