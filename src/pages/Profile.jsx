import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';

export default function Profile() {
  const { nurse, updatePhone } = useAuth();
  const [editing, setEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!nurse) return <div className="page"><div className="empty-state">Not signed in.</div></div>;

  function startEditing() {
    setPhoneInput(nurse.phone || '');
    setError('');
    setEditing(true);
  }

  async function handleSavePhone(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updatePhone(phoneInput.trim());
      setEditing(false);
    } catch (err) {
      setError(err?.message ?? 'Could not save phone number. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Profile</p>
        <h1 className="page-title">{nurse.name}</h1>
      </div>

      <div className="profile-card">
        <p className="profile-name">{nurse.name}</p>
        <p className="profile-role">{nurse.cadre} · {nurse.specialty || 'General practice'}</p>

        <Badge status={nurse.verification}>
          {nurse.verification === 'verified' ? 'License verified' : `License ${nurse.verification}`}
        </Badge>

        {nurse.verification === 'pending' && (
          <p style={{ fontSize: 13, color: 'var(--slate)', margin: '10px 0 0' }}>
            Your license is under review. You'll be able to claim shifts once an admin verifies it —
            usually within 48 hours.
          </p>
        )}

        <div className="profile-grid">
          <div>
            <p className="label">License number</p>
            <p className="value">{nurse.licenseNumber}</p>
          </div>
          <div>
            <p className="label">Experience</p>
            <p className="value">{nurse.yearsExperience} years</p>
          </div>
          <div>
            <p className="label">Rating</p>
            <p className="value">{nurse.rating ? `★ ${nurse.rating}` : 'No shifts yet'}</p>
          </div>
          <div>
            <p className="label">Phone</p>
            {editing ? (
              <form onSubmit={handleSavePhone} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                  autoFocus
                />
                {error && <p className="form-error" style={{ margin: 0 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="claim-btn" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" className="clock-btn" onClick={() => setEditing(false)} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <p className="value">
                {nurse.phone || 'Not provided'}{' '}
                <button type="button" className="clock-btn" style={{ marginLeft: 8 }} onClick={startEditing}>
                  {nurse.phone ? 'Edit' : 'Add phone'}
                </button>
              </p>
            )}
          </div>
          <div>
            <p className="label">Shifts completed</p>
            <p className="value">{nurse.shiftsCompleted}</p>
          </div>
          {(nurse.licenseFileName || nurse.licenseFileUrl) && (
            <div>
              <p className="label">License document</p>
              <p className="value">
                {nurse.licenseFileUrl ? (
                  <a href={nurse.licenseFileUrl} target="_blank" rel="noreferrer">{nurse.licenseFileName}</a>
                ) : (
                  nurse.licenseFileName
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

