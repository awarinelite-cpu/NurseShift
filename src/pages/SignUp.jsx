import { Navigate, useSearchParams } from 'react-router-dom';
import { useRole } from '../context/useRole';
import NurseSignUpForm from '../components/NurseSignUpForm';
import FacilitySignUpForm from '../components/FacilitySignUpForm';

const ROLES = [
  { key: 'nurse', label: 'Nurse', blurb: 'Find and claim shifts' },
  { key: 'facility', label: 'Facility', blurb: 'Post shifts and review nurses' },
];

// The one sign-up page. The person picks Nurse or Facility first; admin accounts
// can't be created here — an existing admin creates them from Admin → Settings.
export default function SignUp() {
  const [params, setParams] = useSearchParams();
  const { role: signedInAs, home, loading } = useRole();
  const role = params.get('role') === 'facility' ? 'facility' : 'nurse';

  if (!loading && signedInAs) return <Navigate to={home} replace />;

  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <div className="form-row" style={{ marginBottom: 18 }}>
        <label>I am signing up as a</label>
        <div style={{ display: 'flex', gap: 10 }} role="radiogroup" aria-label="Account type">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={role === r.key}
              className={`clock-btn${role === r.key ? ' active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setParams(r.key === 'nurse' ? {} : { role: r.key }, { replace: true })}
            >
              {r.label}
            </button>
          ))}
        </div>
        <p className="page-sub" style={{ marginTop: 6 }}>{ROLES.find((r) => r.key === role).blurb}.</p>
      </div>

      {role === 'facility' ? <FacilitySignUpForm /> : <NurseSignUpForm />}
    </div>
  );
}
