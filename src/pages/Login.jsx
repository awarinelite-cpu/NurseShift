import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFacility } from '../context/FacilityContext';
import { useAdmin } from '../context/AdminContext';
import { useRole } from '../context/useRole';
import { signInWithRole, ROLE_HOME } from '../lib/session';

// The one sign-in page for nurses, facilities and admins.
export default function Login() {
  const navigate = useNavigate();
  const { adopt: adoptNurse, isDemo } = useAuth();
  const { adopt: adoptFacility } = useFacility();
  const { adopt: adoptAdmin } = useAdmin();
  const { role: signedInAs, home, loading } = useRole();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!loading && signedInAs && !submitting) return <Navigate to={home} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { role, profile } = await signInWithRole(email, password);
      if (role === 'admin') adoptAdmin(profile);
      else if (role === 'facility') adoptFacility(profile);
      else adoptNurse(profile);
      navigate(ROLE_HOME[role], { replace: true });
    } catch (err) {
      setError(err?.message ?? 'Could not sign in. Check your details and try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <div className="page-header">
        <p className="eyebrow">Welcome back</p>
        <h1 className="page-title">Sign in</h1>
        <p className="page-sub">Nurses, facilities and admins all sign in here.</p>
      </div>

      {isDemo && (
        <p className="page-sub" style={{ marginBottom: 14 }}>
          Demo mode — any email and password signs you in as the sample nurse. Use an email containing
          {' '}<code>facility</code> for the sample facility, or the passcode <code>admin-demo</code> for admin.
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
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
