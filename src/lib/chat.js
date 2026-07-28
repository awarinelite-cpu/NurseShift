import { DEMO_MODE, db } from './firebase';
import {
  demoGetOrCreateConversation,
  demoGetConversation,
  demoSubscribeConversations,
  demoSubscribeMessages,
  demoSendMessage,
  demoListNurseDirectory,
  demoGetNurse,
  demoGetFacility,
} from './demoStore';

// A "participant" is { id, type: 'nurse' | 'facility', name }.
// opts: { type: 'shift' | 'peer', shiftId? } — shift-tied conversations key
// on (participants + shiftId) so claiming the same shift again reopens the
// same thread instead of spawning a new one.

// Turns a raw Firestore error into a message worth showing a user, and
// always logs the original error so it shows up in the browser console for
// debugging (the most common cause here is firestore.rules that haven't
// actually been deployed to the live project yet — pushing code to GitHub/
// Vercel does NOT push firestore.rules; that needs a separate
// `firebase deploy --only firestore:rules`, or pasting the file into
// Firebase Console → Firestore Database → Rules).
function friendlyChatError(err, action) {
  console.error(`[chat] ${action} failed:`, err);
  if (err?.code === 'permission-denied') {
    return new Error(
      `Couldn't ${action} — Firestore denied the request (permission-denied). ` +
        'This usually means firestore.rules were updated in the code but never deployed to the live Firebase project.'
    );
  }
  return new Error(`Couldn't ${action}. ${err?.message || 'Please try again.'}`);
}

export async function getOrCreateConversation(me, other, opts = {}) {
  if (DEMO_MODE) return Promise.resolve(demoGetOrCreateConversation(me, other, opts));

  try {
    const { collection, getDocs, query, where, addDoc, serverTimestamp } = await import('firebase/firestore');
    const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', me.id));
    const snap = await getDocs(q);
    const existing = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find(
        (c) =>
          c.participantIds.includes(other.id) &&
          (opts.shiftId ? c.shiftId === opts.shiftId : !c.shiftId)
      );
    if (existing) return existing;

    const conversation = {
      participantIds: [me.id, other.id],
      participants: [
        { id: me.id, type: me.type, name: me.name },
        { id: other.id, type: other.type, name: other.name },
      ],
      type: opts.type || 'peer',
      shiftId: opts.shiftId || null,
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastSenderId: null,
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'conversations'), conversation);
    return { id: ref.id, ...conversation };
  } catch (err) {
    throw friendlyChatError(err, 'open this conversation');
  }
}

export async function getConversation(conversationId) {
  if (DEMO_MODE) return Promise.resolve(demoGetConversation(conversationId));

  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'conversations', conversationId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    throw friendlyChatError(err, 'load this conversation');
  }
}

// Returns an unsubscribe function. No orderBy in the Firestore query to avoid
// a composite index requirement — sorted client-side instead, matching the
// pattern already used elsewhere in this app.
//
// onError is optional but important: without it, a permission-denied (or any
// other) error from onSnapshot is swallowed and `callback` simply never
// fires again — the caller is left showing "Loading…" forever with no way
// to know something went wrong. Pass onError to surface that instead.
export function subscribeToConversations(userId, callback, onError) {
  if (DEMO_MODE) return demoSubscribeConversations(userId, callback);

  let unsub = () => {};
  let cancelled = false;
  import('firebase/firestore').then(({ collection, query, where, onSnapshot }) => {
    if (cancelled) return;
    const q = query(collection(db, 'conversations'), where('participantIds', 'array-contains', userId));
    unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.lastMessageAt?.toMillis?.() ?? 0) - (a.lastMessageAt?.toMillis?.() ?? 0));
        callback(list);
      },
      (err) => onError?.(friendlyChatError(err, 'load your conversations'))
    );
  });
  return () => {
    cancelled = true;
    unsub();
  };
}

export function subscribeToMessages(conversationId, callback, onError) {
  if (DEMO_MODE) return demoSubscribeMessages(conversationId, callback);

  let unsub = () => {};
  let cancelled = false;
  import('firebase/firestore').then(({ collection, query, orderBy, onSnapshot }) => {
    if (cancelled) return;
    const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'asc'));
    unsub = onSnapshot(
      q,
      (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => onError?.(friendlyChatError(err, 'load messages'))
    );
  });
  return () => {
    cancelled = true;
    unsub();
  };
}

export async function sendMessage(conversationId, sender, text, type = 'text') {
  if (DEMO_MODE) return Promise.resolve(demoSendMessage(conversationId, sender, text, type));

  try {
    const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: sender.id,
      senderType: sender.type,
      senderName: sender.name,
      text,
      type,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      lastSenderId: sender.id,
    });
  } catch (err) {
    throw friendlyChatError(err, 'send that message');
  }
}

// Looks up a conversation participant's phone number for the "call directly"
// fallback — participants embedded on the conversation doc are just
// { id, type, name }, so this fetches the fuller nurses/facilities record.
export async function getParticipantPhone(participant) {
  if (!participant) return null;
  if (DEMO_MODE) {
    const record = participant.type === 'facility' ? demoGetFacility(participant.id) : demoGetNurse(participant.id);
    return record?.phone || null;
  }
  const { doc, getDoc } = await import('firebase/firestore');
  const col = participant.type === 'facility' ? 'facilities' : 'nurses';
  const snap = await getDoc(doc(db, col, participant.id));
  return snap.exists() ? snap.data()?.phone || null : null;
}

// Verified nurses only, for the peer-chat directory — excludes the current nurse.
export async function listNurseDirectory(excludeId) {
  if (DEMO_MODE) return Promise.resolve(demoListNurseDirectory(excludeId));

  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'nurses'), where('verification', '==', 'verified'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((n) => n.id !== excludeId);
}
