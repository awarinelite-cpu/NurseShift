import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { listAdmins, createAdminAccount, removeAdmin } from '../../lib/admin';

const EMPTY = { name: '', email: '', password: '' };

// Admin -> Settings: where approved staff get their admin accounts created.
// Nurses and facilities sign themselves up at /signup; admins can't, by design.
export default function AdminSettings() {
  const { admin } = useAdmin();
  const [admins, setAdmins] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function refresh() {
    try {
      setAdmins(await listAdmins());
    } catch (err) {
      setAdmins([]);
      setError(err?.message ?? 'Could not load admin accounts.');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      await createAdminAccount({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      setNotice(`Account created for ${form.email.trim()}. They can sign in on the normal sign-in page.`);
      setForm(EMPTY);
      await refresh();
    } catch (err) {
      setError(err?.message ?? 'Could not create the account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(a) {
    if (!window.confirm(`Remove admin access for ${a.name || a.email}?`)) return;
    setError('');
    setNotice('');
    try {
      await removeAdmin(a.id);
      await refresh();
    } catch (err) {
      setError(err?.message ?? 'Could not remove this admin.');
    }
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <p className="eyebrow"><Link to="/admin" style={{ textDecoration: 'none' }}>← Dashboard</Link></p>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">
          Create accounts for approved staff. Nurses and facilities sign up themselves at the shared
          sign-up page by choosing their role; admin accounts can only be made here.
        </p>
      </div>

      <form className="detail-card" onSubmit={handleCreate} style={{ marginBottom: 22 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: '1.125rem' }}>New admin account</h2>
        <div className="form-row">
          <label htmlFor="admin-name">Full name</label>
          <input id="admin-name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="admin-email">Email</label>
          <input id="admin-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </div>
        <div className="form-row">
          <label htmlFor="admin-password">Temporary password</label>
          <input id="admin-password" type="password" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required />
          <p className="page-sub" style={{ marginTop: 6 }}>At least 8 characters. Share it with them privately.</p>
        </div>

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="page-sub" style={{ margin: '0 0 12px' }}>{notice}</p>}

        <button className="claim-btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create admin account'}
        </button>
      </form>

      <div className="detail-card">
        <h2 style={{ margin: '0 0 12px', fontSize: '1.125rem' }}>Admin accounts</h2>
        {!admins ? (
          <p className="page-sub">Loading…</p>
        ) : admins.length === 0 ? (
          <p className="page-sub">No admin accounts found.</p>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {admins.map((a) => {
              const isSelf = a.id === admin?.uid || a.email === admin?.email;
              return (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ overflowWrap: 'anywhere' }}>{a.name || a.email}</strong>{isSelf && ' (you)'}
                    {a.name && <div className="page-sub" style={{ margin: 0, overflowWrap: 'anywhere' }}>{a.email}</div>}
                  </div>
                  {!isSelf && (
                    <button type="button" className="clock-btn" onClick={() => handleRemove(a)}>Remove</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
