import RequireRole from './RequireRole';

export default function RequireAuth({ children }) {
  return <RequireRole role="nurse">{children}</RequireRole>;
}
