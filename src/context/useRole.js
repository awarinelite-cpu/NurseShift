import { useAuth } from './AuthContext';
import { useFacility } from './FacilityContext';
import { useAdmin } from './AdminContext';
import { ROLE_HOME } from '../lib/session';

// Which kind of account is signed in right now: 'admin' | 'facility' | 'nurse' | null.
export function useRole() {
  const { nurse, loading: nurseLoading } = useAuth();
  const { facility, loading: facilityLoading } = useFacility();
  const { admin, loading: adminLoading } = useAdmin();
  const role = admin ? 'admin' : facility ? 'facility' : nurse ? 'nurse' : null;
  return { role, home: role ? ROLE_HOME[role] : '/login', loading: nurseLoading || facilityLoading || adminLoading };
}
