import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';

function statusText(activeCall) {
  if (activeCall.status === 'ringing') return activeCall.direction === 'outgoing' ? 'Calling…' : 'Connecting…';
  if (activeCall.status === 'no-answer') return 'No answer';
  return 'Voice call in progress';
}

export default function CallModal() {
  const { incomingCall, activeCall, answerCall, declineCall, hangUp, toggleMute, callDirectly } = useCall();
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = activeCall?.remoteStream ?? null;
  }, [activeCall?.remoteStream]);

  if (incomingCall && !activeCall) {
    return (
      <div className="call-overlay">
        <div className="call-card">
          <div className="call-avatar">{incomingCall.callerName?.[0]?.toUpperCase() ?? '?'}</div>
          <h3>{incomingCall.callerName}</h3>
          <p className="call-status-text">Incoming voice call…</p>
          <div className="call-actions">
            <button className="call-btn decline" onClick={declineCall}>Decline</button>
            <button className="call-btn accept" onClick={answerCall}>Accept</button>
          </div>
        </div>
      </div>
    );
  }

  if (activeCall) {
    const showFallback = activeCall.status === 'no-answer' || activeCall.connectionIssue;
    return (
      <div className="call-overlay in-call">
        <div className="call-card">
          <div className="call-avatar">{activeCall.otherName?.[0]?.toUpperCase() ?? '?'}</div>
          <h3>{activeCall.otherName}</h3>
          <p className="call-status-text">{statusText(activeCall)}</p>
          <audio ref={remoteAudioRef} autoPlay />

          {showFallback && (
            <div className="call-fallback">
              <p className="call-fallback-text">
                {activeCall.status === 'no-answer'
                  ? "They haven't picked up the free call."
                  : "This connection isn't going through — free calls can struggle on some mobile networks."}
              </p>
              {activeCall.otherPhone ? (
                <button type="button" className="call-btn accept" onClick={callDirectly}>
                  📱 Call {activeCall.otherName} directly
                </button>
              ) : (
                <p className="call-fallback-text">No phone number on file to fall back to.</p>
              )}
            </div>
          )}
        </div>

        <div className="call-controls">
          <button onClick={toggleMute} className={`call-icon-btn ${activeCall.muted ? 'active' : ''}`}>
            {activeCall.muted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={hangUp} className="call-btn decline">End</button>
        </div>
      </div>
    );
  }

  return null;
}
