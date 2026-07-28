import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentIdentity } from '../context/CallContext';
import { subscribeToConversations } from '../lib/chat';

export default function Messages() {
  const me = useCurrentIdentity();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!me) return;
    setLoading(true);
    setError(null);
    const unsub = subscribeToConversations(
      me.id,
      (list) => {
        setConversations(list);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [me?.id, retryKey]);

  if (!me) return null;

  const basePath = me.type === 'facility' ? '/facility/messages' : '/messages';

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Chat</p>
        <h1 className="page-title">Messages</h1>
        <p className="page-sub">Text and voice calling with facilities and other nurses.</p>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : error ? (
        <div className="empty-state">
          <p className="form-error" style={{ marginBottom: 12 }}>{error}</p>
          <button className="clock-btn" onClick={() => setRetryKey((k) => k + 1)}>Try again</button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          No conversations yet. Message a facility from a shift, or a fellow nurse from the directory.
        </div>
      ) : (
        <ul className="conversation-list">
          {conversations.map((c) => {
            const other = c.participants.find((p) => p.id !== me.id);
            return (
              <li key={c.id}>
                <Link to={`${basePath}/${c.id}`} className="conversation-row">
                  <div className="conversation-avatar">{other?.name?.[0]?.toUpperCase() ?? '?'}</div>
                  <div className="conversation-info">
                    <strong>{other?.name ?? 'Unknown'}</strong>
                    <span>{c.lastMessage || 'Start the conversation'}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
