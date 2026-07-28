import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentIdentity } from '../context/CallContext';
import { listNurseDirectory, getOrCreateConversation } from '../lib/chat';

export default function NurseDirectory() {
  const me = useCurrentIdentity();
  const [nurses, setNurses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(null);
  const [messageError, setMessageError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!me) return;
    listNurseDirectory(me.id).then((list) => {
      setNurses(list);
      setLoading(false);
    });
  }, [me?.id]);

  async function handleMessage(n) {
    setMessaging(n.id);
    setMessageError(null);
    try {
      const conv = await getOrCreateConversation(me, { id: n.id, type: 'nurse', name: n.name }, { type: 'peer' });
      navigate(`/messages/${conv.id}`);
    } catch (err) {
      setMessageError(err.message);
    } finally {
      setMessaging(null);
    }
  }

  if (!me) return null;

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">{nurses.length} nurses</p>
        <h1 className="page-title">Nurses</h1>
        <p className="page-sub">Message or call another nurse on the platform.</p>
      </div>

      {messageError && <p className="form-error" style={{ marginBottom: 16 }}>{messageError}</p>}

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : nurses.length === 0 ? (
        <div className="empty-state">No other verified nurses found yet.</div>
      ) : (
        <ul className="nurse-directory-list">
          {nurses.map((n) => (
            <li key={n.id} className="nurse-directory-row">
              <div>
                <strong>{n.name}</strong>
                <span className="meta"> · {n.cadre}{n.specialty ? ` · ${n.specialty}` : ''}</span>
              </div>
              <button className="clock-btn" disabled={messaging === n.id} onClick={() => handleMessage(n)}>
                {messaging === n.id ? 'Opening…' : 'Message'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
