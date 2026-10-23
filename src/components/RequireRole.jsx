import { Navigate } from 'react-router-dom';
import { useRole } from '../context/useRole';

// Lets the page render only for the given role. Signed out -> shared /login.
// Signed in as a different role -> that role's own home, not an error page.
export default function RequireRole({ role, children }) {
  const { role: current, home, loading } = useRole();
  if (loading) return <div className="page"><div className="empty-state">Loading…</div></div>;
  if (current === role) return children;
  return <Navigate to={home} replace />;
}
