import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { DEMO_MODE, db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useFacility } from './FacilityContext';
import { sendMessage, getParticipantPhone } from '../lib/chat';
import { ICE_SERVERS } from '../lib/webrtc';
import { startPresenceHeartbeat } from '../lib/presence';

const CallContext = createContext(null);

// How long an outgoing call can ring with no answer before we give up and
// surface the "call directly" phone fallback.
const RING_TIMEOUT_MS = 30000;
// How long we wait for the WebRTC connection to actually establish (STUN-only
// has no TURN relay, so this can fail on strict/carrier-grade mobile NAT —
// see src/lib/webrtc.js) before offering the phone fallback.
const CONNECT_TIMEOUT_MS = 15000;

// Works out "who is currently browsing this app" regardless of whether
// they're signed in as a nurse or a facility — chat and calling are
// identity-agnostic, they just need { id, type, name }.
export function useCurrentIdentity() {
  const { nurse } = useAuth();
  const { facility } = useFacility();
  if (nurse) return { id: nurse.id, type: 'nurse', name: nurse.name };
  if (facility) return { id: facility.id, type: 'facility', name: facility.name };
  return null;
}

export function CallProvider({ children }) {
  const me = useCurrentIdentity();
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const unsubsRef = useRef([]);
  const activeCallRef = useRef(null); // mirrors activeCall for use inside listeners
  const timeoutsRef = useRef([]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  // Real-time "active users" on the admin dashboard depends on a live
  // heartbeat from every signed-in session — this is the one place both
  // nurse and facility identities already flow through.
  useEffect(() => {
    if (!me) return;
    return startPresenceHeartbeat(me);
  }, [me?.id]);

  // Listen for calls addressed to me that are still ringing.
  useEffect(() => {
    if (DEMO_MODE || !me) return;
    let unsub = () => {};
    let cancelled = false;
    import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
      if (cancelled) return;
      const q = query(collection(db, 'calls'), where('calleeId', '==', me.id), where('status', '==', 'ringing'));
      unsub = onSnapshot(q, (snap) => {
        const calls = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        calls.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
        const next = calls[0] || null;
        // Don't surface a new incoming-call screen if already on a call.
        if (activeCallRef.current) return;
        setIncomingCall(next);
      });
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [me?.id]);

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  }, []);

  const teardown = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => s.track && s.track.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    unsubsRef.current.forEach((fn) => fn());
    unsubsRef.current = [];
    clearTimers();
  }, [clearTimers]);

  async function createPeerConnection(callId, myCandidatesField) {
    const { collection, addDoc } = await import('firebase/firestore');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        addDoc(collection(db, 'calls', callId, myCandidatesField), e.candidate.toJSON()).catch(() => {});
      }
    };
    pc.ontrack = (e) => {
      setActiveCall((prev) => (prev ? { ...prev, remoteStream: e.streams[0] } : prev));
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setActiveCall((prev) => (prev ? { ...prev, status: 'active', connectionIssue: false } : prev));
      }
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        setActiveCall((prev) => (prev ? { ...prev, connectionIssue: true } : prev));
      }
    };
    pcRef.current = pc;
    return pc;
  }

  async function logCallEnd(conversationId, status) {
    if (!conversationId || !me) return;
    const text =
      status === 'declined'
        ? 'Voice call declined'
        : status === 'missed'
        ? 'Missed voice call'
        : status === 'unavailable'
        ? 'Voice call could not connect — try calling directly'
        : 'Voice call ended';
    try {
      await sendMessage(conversationId, me, text, 'call-log');
    } catch {
      // best-effort — don't block call teardown on a logging failure
    }
  }

  // Opens the device's native phone dialer as a fallback when the in-app
  // free voice call can't be used (no phone number saved, or the WebRTC
  // connection isn't working on this network).
  function callByPhone(phone) {
    if (!phone) return;
    window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
  }

  async function startCall(conversation, other) {
    if (activeCallRef.current) return;

    const otherPhone = await getParticipantPhone(other).catch(() => null);

    if (DEMO_MODE) {
      if (otherPhone) {
        callByPhone(otherPhone);
      } else {
        alert('Calling needs live Firebase mode to connect two real users — see the README to go live.');
      }
      return;
    }

    const { collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp } = await import('firebase/firestore');

    let localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      // No mic access — go straight to the phone fallback if we have a number.
      if (otherPhone) {
        callByPhone(otherPhone);
      } else {
        alert('Could not access the microphone. Check browser permissions and try again.');
      }
      return;
    }
    localStreamRef.current = localStream;

    const callRef = await addDoc(collection(db, 'calls'), {
      conversationId: conversation.id,
      callerId: me.id,
      callerName: me.name,
      callerType: me.type,
      calleeId: other.id,
      calleeName: other.name,
      calleeType: other.type,
      type: 'audio',
      status: 'ringing',
      offer: null,
      answer: null,
      createdAt: serverTimestamp(),
    });

    setActiveCall({
      id: callRef.id,
      conversationId: conversation.id,
      type: 'audio',
      direction: 'outgoing',
      status: 'ringing',
      otherName: other.name,
      otherPhone,
      localStream,
      remoteStream: null,
      muted: false,
      connectionIssue: false,
    });

    const pc = await createPeerConnection(callRef.id, 'callerCandidates');
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await updateDoc(doc(db, 'calls', callRef.id), { offer: { sdp: offer.sdp, type: offer.type } });

    const unsubDoc = onSnapshot(doc(db, 'calls', callRef.id), async (snap) => {
      const data = snap.data();
      if (!data) return;
      if (data.answer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
      if (data.status === 'declined' || data.status === 'ended') {
        teardown();
        setActiveCall(null);
      }
    });
    const unsubCandidates = onSnapshot(collection(db, 'calls', callRef.id, 'calleeCandidates'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
      });
    });
    unsubsRef.current = [unsubDoc, unsubCandidates];

    // No answer within the ring window — mark it unreachable rather than
    // ringing forever, and log it so the callee sees they missed it.
    const ringTimer = setTimeout(() => {
      setActiveCall((prev) => (prev && prev.status === 'ringing' ? { ...prev, status: 'no-answer' } : prev));
    }, RING_TIMEOUT_MS);
    // Connection never established — likely no TURN relay on this network.
    const connectTimer = setTimeout(() => {
      const state = pcRef.current?.iceConnectionState;
      if (state && state !== 'connected' && state !== 'completed') {
        setActiveCall((prev) => (prev ? { ...prev, connectionIssue: true } : prev));
      }
    }, CONNECT_TIMEOUT_MS);
    timeoutsRef.current = [ringTimer, connectTimer];
  }

  async function answerCall() {
    if (!incomingCall || DEMO_MODE) return;
    const call = incomingCall;
    setIncomingCall(null);

    const { doc, collection, updateDoc, onSnapshot } = await import('firebase/firestore');

    let localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      alert('Could not access the microphone. Check browser permissions and try again.');
      const { updateDoc: upd } = await import('firebase/firestore');
      await upd(doc(db, 'calls', call.id), { status: 'declined' }).catch(() => {});
      return;
    }
    localStreamRef.current = localStream;

    const callerPhone = await getParticipantPhone({ id: call.callerId, type: call.callerType }).catch(() => null);

    setActiveCall({
      id: call.id,
      conversationId: call.conversationId,
      type: 'audio',
      direction: 'incoming',
      status: 'active',
      otherName: call.callerName,
      otherPhone: callerPhone,
      localStream,
      remoteStream: null,
      muted: false,
      connectionIssue: false,
    });

    const pc = await createPeerConnection(call.id, 'calleeCandidates');
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    await pc.setRemoteDescription(new RTCSessionDescription(call.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await updateDoc(doc(db, 'calls', call.id), { answer: { sdp: answer.sdp, type: answer.type }, status: 'active' });

    const unsubDoc = onSnapshot(doc(db, 'calls', call.id), (snap) => {
      const data = snap.data();
      if (!data) return;
      if (data.status === 'ended') {
        teardown();
        setActiveCall(null);
      }
    });
    const unsubCandidates = onSnapshot(collection(db, 'calls', call.id, 'callerCandidates'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
      });
    });
    unsubsRef.current = [unsubDoc, unsubCandidates];

    const connectTimer = setTimeout(() => {
      const state = pcRef.current?.iceConnectionState;
      if (state && state !== 'connected' && state !== 'completed') {
        setActiveCall((prev) => (prev ? { ...prev, connectionIssue: true } : prev));
      }
    }, CONNECT_TIMEOUT_MS);
    timeoutsRef.current = [connectTimer];
  }

  async function declineCall() {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'calls', call.id), { status: 'declined' }).catch(() => {});
    await logCallEnd(call.conversationId, 'declined');
  }

  async function hangUp() {
    const call = activeCallRef.current;
    const wasUnreachable = call?.status === 'no-answer' || call?.connectionIssue;
    teardown();
    setActiveCall(null);
    if (call?.id) {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'calls', call.id), { status: 'ended' }).catch(() => {});
      await logCallEnd(call.conversationId, wasUnreachable ? 'unavailable' : 'ended');
    }
  }

  // Falls back to a direct phone call, keeping the in-app record consistent.
  function callDirectly() {
    const call = activeCallRef.current;
    if (call?.otherPhone) callByPhone(call.otherPhone);
  }

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setActiveCall((prev) => (prev ? { ...prev, muted: !prev.muted } : prev));
  }

  return (
    <CallContext.Provider
      value={{
        me,
        incomingCall,
        activeCall,
        startCall,
        answerCall,
        declineCall,
        hangUp,
        toggleMute,
        callDirectly,
        callByPhone,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  return useContext(CallContext);
}
