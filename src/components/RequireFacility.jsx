import RequireRole from './RequireRole';

export default function RequireFacility({ children }) {
  return <RequireRole role="facility">{children}</RequireRole>;
}
