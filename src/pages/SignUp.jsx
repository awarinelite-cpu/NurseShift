import { Navigate, useSearchParams, Link } from 'react-router-dom';
import { useRole } from '../context/useRole';
import NurseSignUpForm from '../components/NurseSignUpForm';
import FacilitySignUpForm from '../components/FacilitySignUpForm';
import Icon from '../components/ns/Icon';

const ROLES = [
  { key: 'nurse', label: 'Nurse', blurb: 'Find and claim shifts' },
  { key: 'facility', label: 'Facility', blurb: 'Post shifts and review nurses' },
];

// The one sign-up page. The person picks Nurse or Facility first; admin accounts
// can't be created here. An existing admin creates them from Admin > Settings.
export default function SignUp() {
  const [params, setParams] = useSearchParams();
  const { role: signedInAs, home, loading } = useRole();
  const role = params.get('role') === 'facility' ? 'facility' : 'nurse';

  if (!loading && signedInAs) return <Navigate to={home} replace />;

  return (
    <main className="ns-auth">
      <div className="ns-auth-head">
        <Link to="/" className="ns-logo sm">
          <Icon name="logo" size={34} strokeWidth={2.2} className="ns-logo-mark" />
          <span>Nurse<b>Shift</b></span>
        </Link>
        <h1>Create your account</h1>
        <p>{ROLES.find((r) => r.key === role).blurb}.</p>
      </div>

      <div className="ns-auth-body">
        <div className="ns-segment" role="radiogroup" aria-label="Account type">
          {ROLES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="radio"
              aria-checked={role === r.key}
              className={role === r.key ? 'on' : ''}
              onClick={() => setParams(r.key === 'nurse' ? {} : { role: r.key }, { replace: true })}
            >
              {r.label}
            </button>
          ))}
        </div>

        {role === 'facility' ? <FacilitySignUpForm /> : <NurseSignUpForm />}
      </div>
    </main>
  );
}
