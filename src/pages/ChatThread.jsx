import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCurrentIdentity, useCall } from '../context/CallContext';
import { getConversation, subscribeToMessages, sendMessage, getParticipantPhone } from '../lib/chat';

function formatTime(ts) {
  const ms = ts?.toMillis?.() ?? ts;
  if (!ms) return '';
  return new Date(ms).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
}

export default function ChatThread() {
  const { conversationId } = useParams();
  const me = useCurrentIdentity();
  const { startCall, callByPhone } = useCall();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherPhone, setOtherPhone] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getConversation(conversationId).then((c) => {
      if (!cancelled) setConversation(c);
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const unsub = subscribeToMessages(conversationId, setMessages);
    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const other = conversation?.participants?.find((p) => p.id !== me?.id);
  const backPath = me?.type === 'facility' ? '/facility/messages' : '/messages';

  useEffect(() => {
    let cancelled = false;
    if (!other) return;
    getParticipantPhone(other).then((phone) => {
      if (!cancelled) setOtherPhone(phone);
    });
    return () => {
      cancelled = true;
    };
  }, [other?.id]);

  async function handleSend(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setText('');
    await sendMessage(conversationId, me, value);
    setSending(false);
  }

  function handleCall() {
    if (!conversation || !other) return;
    startCall(conversation, other);
  }

  if (!me) return null;

  return (
    <div className="page chat-thread-page">
      <Link to={backPath} className="back-link">← Back to messages</Link>

      <div className="chat-thread">
        <div className="chat-header">
          <div className="conversation-info">
            <strong>{other?.name ?? 'Conversation'}</strong>
            {conversation?.shiftId && <span>About shift {conversation.shiftId}</span>}
          </div>
          <div className="chat-header-actions">
            <button type="button" onClick={handleCall} title="Free voice call" aria-label="Free voice call">📞</button>
            {otherPhone && (
              <button
                type="button"
                onClick={() => callByPhone(otherPhone)}
                title={`Call ${other?.name ?? ''} directly`}
                aria-label="Call directly"
              >
                📱
              </button>
            )}
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && <p className="empty-state">No messages yet — say hello.</p>}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble ${m.senderId === me.id ? 'mine' : ''} ${m.type === 'call-log' ? 'call-log' : ''}`}
            >
              {m.type === 'call-log' ? (
                <span>📞 {m.text}</span>
              ) : (
                <>
                  <span>{m.text}</span>
                  <time>{formatTime(m.createdAt)}</time>
                </>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form className="chat-composer" onSubmit={handleSend}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            aria-label="Message"
          />
          <button type="submit" disabled={!text.trim() || sending}>Send</button>
        </form>
      </div>
    </div>
  );
}
