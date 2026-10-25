import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClaims } from '../lib/useClaims';
import { initials } from '../lib/earnings';
import { listOpenShifts } from '../lib/shifts';
import Icon from '../components/ns/Icon';
import NurseHero from '../components/ns/NurseHero';
import Sheet from '../components/ns/Sheet';

const MENU = [
  { key: 'license', label: 'My License & Documents', icon: 'file' },
  { key: 'personal', label: 'Personal Information', icon: 'user' },
  { key: 'payment', label: 'Payment Methods', icon: 'card' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'help', label: 'Help & Support', icon: 'help' },
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

const VERIFY_LABEL = { verified: 'Fully Verified', pending: 'Under Review', rejected: 'Not Verified' };

function Row({ label, value }) {
  return (
    <div className="ns-kv">
      <small>{label}</small>
      <span>{value || 'Not provided'}</span>
    </div>
  );
}

export default function Profile() {
  const { nurse, updatePhone, signOut } = useAuth();
  const navigate = useNavigate();
  const { claims } = useClaims(nurse?.id);
  const [openCount, setOpenCount] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listOpenShifts().then((list) => setOpenCount(list.filter((s) => s.status === 'open').length));
  }, []);

  if (!nurse) return <div className="ns-screen"><div className="ns-empty">Not signed in.</div></div>;

  const completed = claims.filter((c) => c.status === 'completed').length;

  function closeSheet() {
    setSheet(null);
    setEditing(false);
    setError('');
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

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <div className="ns-screen nsd-nurse nsd-board">
      <NurseHero
        back={false}
        right={
          <button type="button" className="nsd-back" onClick={() => setSheet('settings')} aria-label="Settings">
            <Icon name="settings" size={22} />
          </button>
        }
      >
        <section className="ns-profile-head">
          <span className="ns-avatar lg">{initials(nurse.name)}</span>
          <div>
            <h1>{nurse.name}</h1>
            <p>Registered Nurse</p>
            <span className={`ns-verified ${nurse.verification}`}>
              <Icon name="shieldCheck" size={14} /> {VERIFY_LABEL[nurse.verification] ?? 'Under Review'}
            </span>
          </div>
        </section>
      </NurseHero>

      <div className="ns-card ns-profile-stats">
        <div><strong>{completed}</strong><small>Completed Shifts</small></div>
        <div><strong>{nurse.rating ? Number(nurse.rating).toFixed(1) : '-'}</strong><small>Rating</small></div>
        <div><strong>{openCount ?? '-'}</strong><small>Available Shifts</small></div>
      </div>

      <ul className="ns-menu">
        {MENU.map((m) => (
          <li key={m.key}>
            <button type="button" onClick={() => setSheet(m.key)}>
              <span className="ns-menu-icon"><Icon name={m.icon} size={18} /></span>
              <span className="ns-menu-label">{m.label}</span>
              <Icon name="chevR" size={18} />
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="ns-btn ns-btn-danger ns-btn-block" onClick={handleSignOut}>Log Out</button>

      {sheet === 'license' && (
        <Sheet title="My License & Documents" onClose={closeSheet}>
          <Row label="NMCN license number" value={nurse.licenseNumber} />
          <Row label="Verification" value={VERIFY_LABEL[nurse.verification]} />
          <Row label="Cadre" value={nurse.cadre} />
          <div className="ns-kv">
            <small>License document</small>
            <span>
              {nurse.licenseFileUrl ? (
                <a href={nurse.licenseFileUrl} target="_blank" rel="noreferrer">{nurse.licenseFileName}</a>
              ) : (
                nurse.licenseFileName || 'Not uploaded'
              )}
            </span>
          </div>
          {nurse.verification === 'pending' && (
            <p className="ns-note">Your license is under review. You can claim shifts once an admin verifies it, usually within 48 hours.</p>
          )}
        </Sheet>
      )}

      {sheet === 'personal' && (
        <Sheet title="Personal Information" onClose={closeSheet}>
          <Row label="Full name" value={nurse.name} />
          <Row label="Specialty" value={nurse.specialty || 'General practice'} />
          <Row label="Experience" value={nurse.yearsExperience != null ? `${nurse.yearsExperience} years` : ''} />
          <div className="ns-kv">
            <small>Phone</small>
            {editing ? (
              <form onSubmit={handleSavePhone} className="ns-inline-form">
                <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="e.g. 0803 123 4567" autoFocus />
                {error && <p className="ns-error">{error}</p>}
                <div>
                  <button type="submit" className="ns-btn ns-btn-green ns-btn-sm" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                  <button type="button" className="ns-btn ns-btn-outline ns-btn-sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                </div>
              </form>
            ) : (
              <span>
                {nurse.phone || 'Not provided'}{' '}
                <button type="button" className="ns-link" onClick={() => { setPhoneInput(nurse.phone || ''); setError(''); setEditing(true); }}>
                  {nurse.phone ? 'Edit' : 'Add phone'}
                </button>
              </span>
            )}
          </div>
        </Sheet>
      )}

      {sheet === 'payment' && (
        <Sheet title="Payment Methods" onClose={closeSheet}>
          <p className="ns-note">Payout accounts can't be managed in the app yet. Your earnings and pending payments are tracked on the Earnings tab.</p>
        </Sheet>
      )}

      {sheet === 'notifications' && (
        <Sheet title="Notifications" onClose={closeSheet}>
          <p className="ns-note">Shift approvals and facility replies arrive in your Messages inbox.</p>
          <Link to="/messages" className="ns-btn ns-btn-green ns-btn-block">Open Messages</Link>
        </Sheet>
      )}

      {sheet === 'help' && (
        <Sheet title="Help & Support" onClose={closeSheet}>
          <p className="ns-note">Had a problem with a shift? Open My Shifts and choose Report issue on that shift. An admin will review it.</p>
          <Link to="/my-shifts" className="ns-btn ns-btn-outline ns-btn-block">Go to My Shifts</Link>
        </Sheet>
      )}

      {sheet === 'settings' && (
        <Sheet title="Settings" onClose={closeSheet}>
          <Link to="/messages" className="ns-sheet-link"><Icon name="message" size={18} /> Messages <Icon name="chevR" size={16} /></Link>
          <Link to="/nurses" className="ns-sheet-link"><Icon name="users" size={18} /> Nurse Directory <Icon name="chevR" size={16} /></Link>
        </Sheet>
      )}
    </div>
  );
}
