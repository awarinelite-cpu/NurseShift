import { Navigate } from 'react-router-dom';
import { useRole } from '../context/useRole';
import Landing from './Landing';
import Dashboard from './Dashboard';

// "/" is the landing page for visitors, the dashboard for nurses, and the right home for other roles.
export default function Home() {
  const { role, home, loading } = useRole();
  if (loading) return <div className="ns-screen"><div className="ns-empty">Loading...</div></div>;
  if (role === 'nurse') return <Dashboard />;
  if (role) return <Navigate to={home} replace />;
  return <Landing />;
}
