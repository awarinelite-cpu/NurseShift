import { Navigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

// Settings is owner-only: a subadmin who opens it goes back to the dashboard.
export default function RequireOwner({ children }) {
  const { admin } = useAdmin();
  if (admin?.role === 'subadmin') return <Navigate to="/admin" replace />;
  return children;
}
