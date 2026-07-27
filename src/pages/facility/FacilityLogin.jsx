import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFacility } from '../../context/FacilityContext';

export default function FacilityLogin() {
  const navigate = useNavigate();
  const { signIn, isDemo } = useFacility();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/facility');
    } catch (err) {
      setError(err?.message ?? 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <div className="page-header">
        <p className="eyebrow">Facility sign in</p>
        <h1 className="page-title">Welcome back</h1>
      </div>

      {isDemo && (
        <p className="page-sub" style={{ marginBottom: 14 }}>
          Demo mode — any email/password signs you in as the seeded facility (Reddington Hospital).
        </p>
      )}

      <form className="detail-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button className="claim-btn" type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="form-footer">
          New facility? <Link to="/facility/signup">Register</Link>
        </p>
      </form>
    </div>
  );
}
