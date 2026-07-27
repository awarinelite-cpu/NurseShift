import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFacility } from '../../context/FacilityContext';
import { postShift } from '../../lib/facility';

const UNITS = ['ICU', 'Accident & Emergency', 'Labour Ward', 'Paediatrics', 'Theatre', 'General Medicine'];
const CADRES = ['RN', 'RM', 'RPN'];

export default function PostShift() {
  const { facility } = useFacility();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    unit: UNITS[0],
    cadre: CADRES[0],
    date: '',
    start: '19:00',
    end: '07:00',
    hours: 12,
    rate: '',
    urgency: 'normal',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [posted, setPosted] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.date || !form.rate) {
      setError('Fill in the date and rate.');
      return;
    }
    setSubmitting(true);
    try {
      const shift = await postShift(facility, {
        ...form,
        hours: Number(form.hours),
        rate: Number(form.rate),
        facilityRating: 0,
      });
      setPosted(shift);
      setForm((f) => ({ ...f, date: '', rate: '' }));
    } catch (err) {
      setError(err?.message ?? 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <div className="page-header">
        <p className="eyebrow">{facility?.name}</p>
        <h1 className="page-title">Post a Shift</h1>
        <p className="page-sub">This goes straight onto the nurse duty board.</p>
      </div>

      {posted && (
        <div className="claim-card" style={{ marginBottom: 16, borderColor: 'var(--green)' }}>
          <div>
            <div className="facility">Posted: {posted.id}</div>
            <div className="meta">{posted.unit} · {posted.date} · {posted.start}–{posted.end}</div>
          </div>
          <button className="clock-btn" onClick={() => navigate('/facility')}>View claims</button>
        </div>
      )}

      <form className="detail-card" onSubmit={handleSubmit}>
        <div className="form-grid-2">
          <div className="form-row">
            <label htmlFor="unit">Unit</label>
            <select id="unit" value={form.unit} onChange={(e) => update('unit', e.target.value)}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="cadre">Cadre required</label>
            <select id="cadre" value={form.cadre} onChange={(e) => update('cadre', e.target.value)}>
              {CADRES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="date">Date</label>
          <input id="date" type="date" value={form.date} onChange={(e) => update('date', e.target.value)} required />
        </div>

        <div className="form-grid-2">
          <div className="form-row">
            <label htmlFor="start">Start time</label>
            <input id="start" type="time" value={form.start} onChange={(e) => update('start', e.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="end">End time</label>
            <input id="end" type="time" value={form.end} onChange={(e) => update('end', e.target.value)} />
          </div>
        </div>

        <div className="form-grid-2">
          <div className="form-row">
            <label htmlFor="hours">Hours</label>
            <input id="hours" type="number" min="1" value={form.hours} onChange={(e) => update('hours', e.target.value)} />
          </div>
          <div className="form-row">
            <label htmlFor="rate">Rate (₦)</label>
            <input id="rate" type="number" min="0" placeholder="e.g. 9000" value={form.rate} onChange={(e) => update('rate', e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="urgency">Urgency</label>
          <select id="urgency" value={form.urgency} onChange={(e) => update('urgency', e.target.value)}>
            <option value="normal">Normal</option>
            <option value="urgent">Urgent — flag as closing soon</option>
          </select>
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="claim-btn" type="submit" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post shift'}
        </button>
      </form>
    </div>
  );
}
