import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFacility } from '../../context/FacilityContext';

export default function FacilitySignUp() {
  const navigate = useNavigate();
  const { signUp } = useFacility();
  const [form, setForm] = useState({ name: '', city: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name || !form.city || !form.email || !form.password) {
      setError('Fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(form);
      navigate('/facility');
    } catch (err) {
      setError(err?.message ?? 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 460 }}>
      <div className="page-header">
        <p className="eyebrow">Facility sign-up</p>
        <h1 className="page-title">Register your facility</h1>
        <p className="page-sub">Post open shifts and review nurses who claim them.</p>
      </div>

      <form className="detail-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="name">Facility name</label>
          <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="city">City / area</label>
          <input id="city" placeholder="e.g. Victoria Island, Lagos" value={form.city} onChange={(e) => update('city', e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="claim-btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="form-footer">
          Already registered? <Link to="/facility/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
