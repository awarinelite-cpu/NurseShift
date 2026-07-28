import { useEffect, useRef } from 'react';
import { useCall } from '../context/CallContext';

export default function CallModal() {
  const { incomingCall, activeCall, answerCall, declineCall, hangUp, toggleMute, toggleVideo } = useCall();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = activeCall?.localStream ?? null;
  }, [activeCall?.localStream]);

  useEffect(() => {
    if (activeCall?.type === 'video' && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = activeCall?.remoteStream ?? null;
    }
    if (activeCall?.type === 'audio' && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = activeCall?.remoteStream ?? null;
    }
  }, [activeCall?.remoteStream, activeCall?.type]);

  if (incomingCall && !activeCall) {
    return (
      <div className="call-overlay">
        <div className="call-card">
          <div className="call-avatar">{incomingCall.callerName?.[0]?.toUpperCase() ?? '?'}</div>
          <h3>{incomingCall.callerName}</h3>
          <p className="call-status-text">
            Incoming {incomingCall.type === 'video' ? 'video' : 'voice'} call…
          </p>
          <div className="call-actions">
            <button className="call-btn decline" onClick={declineCall}>Decline</button>
            <button className="call-btn accept" onClick={answerCall}>Accept</button>
          </div>
        </div>
      </div>
    );
  }

  if (activeCall) {
    return (
      <div className="call-overlay in-call">
        {activeCall.type === 'video' ? (
          <div className="video-stage">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
            <div className="video-caption">
              <strong>{activeCall.otherName}</strong>
              <span>{activeCall.status === 'ringing' ? 'Calling…' : 'Connected'}</span>
            </div>
          </div>
        ) : (
          <div className="call-card">
            <div className="call-avatar">{activeCall.otherName?.[0]?.toUpperCase() ?? '?'}</div>
            <h3>{activeCall.otherName}</h3>
            <p className="call-status-text">{activeCall.status === 'ringing' ? 'Calling…' : 'Voice call in progress'}</p>
            <audio ref={remoteAudioRef} autoPlay />
          </div>
        )}
        <div className="call-controls">
          <button onClick={toggleMute} className={`call-icon-btn ${activeCall.muted ? 'active' : ''}`}>
            {activeCall.muted ? 'Unmute' : 'Mute'}
          </button>
          {activeCall.type === 'video' && (
            <button onClick={toggleVideo} className={`call-icon-btn ${activeCall.videoOff ? 'active' : ''}`}>
              {activeCall.videoOff ? 'Video on' : 'Video off'}
            </button>
          )}
          <button onClick={hangUp} className="call-btn decline">End</button>
        </div>
      </div>
    );
  }

  return null;
}
