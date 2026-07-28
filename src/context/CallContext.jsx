import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { DEMO_MODE, db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useFacility } from './FacilityContext';
import { sendMessage } from '../lib/chat';
import { ICE_SERVERS } from '../lib/webrtc';

const CallContext = createContext(null);

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

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

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

  const teardown = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => s.track && s.track.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    unsubsRef.current.forEach((fn) => fn());
    unsubsRef.current = [];
  }, []);

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
    pcRef.current = pc;
    return pc;
  }

  async function logCallEnd(conversationId, type, status) {
    if (!conversationId || !me) return;
    const label = type === 'video' ? 'Video call' : 'Voice call';
    const text = status === 'declined' ? `${label} declined` : status === 'missed' ? `Missed ${label.toLowerCase()}` : `${label} ended`;
    try {
      await sendMessage(conversationId, me, text, 'call-log');
    } catch {
      // best-effort — don't block call teardown on a logging failure
    }
  }

  async function startCall(conversation, other, type) {
    if (DEMO_MODE) {
      alert('Calling needs live Firebase mode to connect two real users — see the README to go live.');
      return;
    }
    if (activeCallRef.current) return;

    const { collection, addDoc, doc, onSnapshot, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const constraints = type === 'video' ? { audio: true, video: true } : { audio: true, video: false };

    let localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      alert('Could not access microphone/camera. Check browser permissions and try again.');
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
      type,
      status: 'ringing',
      offer: null,
      answer: null,
      createdAt: serverTimestamp(),
    });

    setActiveCall({
      id: callRef.id,
      conversationId: conversation.id,
      type,
      direction: 'outgoing',
      status: 'ringing',
      otherName: other.name,
      localStream,
      remoteStream: null,
      muted: false,
      videoOff: false,
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
        setActiveCall((prev) => (prev ? { ...prev, status: 'active' } : prev));
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
  }

  async function answerCall() {
    if (!incomingCall || DEMO_MODE) return;
    const call = incomingCall;
    setIncomingCall(null);

    const { doc, collection, updateDoc, onSnapshot } = await import('firebase/firestore');
    const constraints = call.type === 'video' ? { audio: true, video: true } : { audio: true, video: false };

    let localStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      alert('Could not access microphone/camera. Check browser permissions and try again.');
      const { updateDoc: upd } = await import('firebase/firestore');
      await upd(doc(db, 'calls', call.id), { status: 'declined' }).catch(() => {});
      return;
    }
    localStreamRef.current = localStream;

    setActiveCall({
      id: call.id,
      conversationId: call.conversationId,
      type: call.type,
      direction: 'incoming',
      status: 'active',
      otherName: call.callerName,
      localStream,
      remoteStream: null,
      muted: false,
      videoOff: false,
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
  }

  async function declineCall() {
    if (!incomingCall) return;
    const call = incomingCall;
    setIncomingCall(null);
    const { doc, updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'calls', call.id), { status: 'declined' }).catch(() => {});
    await logCallEnd(call.conversationId, call.type, 'declined');
  }

  async function hangUp() {
    const call = activeCallRef.current;
    teardown();
    setActiveCall(null);
    if (call?.id) {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'calls', call.id), { status: 'ended' }).catch(() => {});
      await logCallEnd(call.conversationId, call.type, 'ended');
    }
  }

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setActiveCall((prev) => (prev ? { ...prev, muted: !prev.muted } : prev));
  }

  function toggleVideo() {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setActiveCall((prev) => (prev ? { ...prev, videoOff: !prev.videoOff } : prev));
  }

  return (
    <CallContext.Provider
      value={{ me, incomingCall, activeCall, startCall, answerCall, declineCall, hangUp, toggleMute, toggleVideo }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  return useContext(CallContext);
}
