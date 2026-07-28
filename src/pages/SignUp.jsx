import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CADRES = ['RN', 'RM', 'RPN'];
const MAX_FILE_MB = 8;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    cadre: 'RN',
    specialty: '',
    yearsExperience: '',
    licenseNumber: '',
    phone: '',
  });
  const [licenseFile, setLicenseFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) {
      setLicenseFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Upload a PDF, JPG, or PNG of your license.');
      setLicenseFile(null);
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`File is too large — keep it under ${MAX_FILE_MB}MB.`);
      setLicenseFile(null);
      return;
    }
    setLicenseFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!form.name || !form.email || !form.password || !form.licenseNumber) {
      setFormError('Fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ ...form, licenseFile });
      navigate('/profile');
    } catch (err) {
      setFormError(err?.message ?? 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 520 }}>
      <div className="page-header">
        <p className="eyebrow">Nurse sign-up</p>
        <h1 className="page-title">Join the duty board</h1>
        <p className="page-sub">
          Your license is reviewed manually before you can claim shifts — most nurses hear back within 48 hours.
          Document upload is optional for now; you can also send a copy separately if asked.
        </p>
      </div>

      <form className="detail-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="name">Full name</label>
          <input id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>

        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </div>

        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required />
        </div>

        <div className="form-grid-2">
          <div className="form-row">
            <label htmlFor="cadre">Cadre</label>
            <select id="cadre" value={form.cadre} onChange={(e) => update('cadre', e.target.value)}>
              {CADRES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="years">Years experience</label>
            <input id="years" type="number" min="0" value={form.yearsExperience} onChange={(e) => update('yearsExperience', e.target.value)} required />
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="specialty">Specialty</label>
          <input id="specialty" placeholder="e.g. Critical Care, Labour Ward" value={form.specialty} onChange={(e) => update('specialty', e.target.value)} />
        </div>

        <div className="form-row">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            placeholder="e.g. 0803 123 4567"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
          <p className="page-sub" style={{ marginTop: 6 }}>
            Used as a direct-call fallback if an in-app voice call can't connect.
          </p>
        </div>

        <div className="form-row">
          <label htmlFor="license-number">NMCN license number</label>
          <input id="license-number" placeholder="NMCN/RN/2018/04471" value={form.licenseNumber} onChange={(e) => update('licenseNumber', e.target.value)} required />
        </div>

        <div className="form-row">
          <label htmlFor="license-file">License document (PDF, JPG, or PNG) — optional</label>
          <input id="license-file" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
          {licenseFile && <p className="file-picked">Selected: {licenseFile.name}</p>}
          {fileError && <p className="form-error">{fileError}</p>}
        </div>

        {formError && <p className="form-error">{formError}</p>}

        <button className="claim-btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="form-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
