import { Navigate } from 'react-router-dom';
import { useFacility } from '../context/FacilityContext';

export default function RequireFacility({ children }) {
  const { facility, loading } = useFacility();
  if (loading) return <div className="page"><div className="empty-state">Loading…</div></div>;
  if (!facility) return <Navigate to="/facility/login" replace />;
  return children;
}
