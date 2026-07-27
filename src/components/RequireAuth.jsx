import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { nurse, loading } = useAuth();

  if (loading) return <div className="page"><div className="empty-state">Loading…</div></div>;
  if (!nurse) return <Navigate to="/login" replace />;

  return children;
}
