import RequireRole from './RequireRole';

export default function RequireAdmin({ children }) {
  return <RequireRole role="admin">{children}</RequireRole>;
}
