import { mockNurse, mockShifts, mockClaims } from './mockData';
import { seedFacilities, seedShifts } from './seedData';

// A tiny shared in-memory "database" for demo mode, so nurse sign-up, facility
// actions, and admin review all see the same data without a real backend.
// Not used once DEMO_MODE is off — everything switches to Firestore then.

// ---------- Nurses ----------
let _nurses = [{ ...mockNurse }]; // seeded with one already-verified sample nurse
let _nextNurseId = 1;

export function demoAddNurse(profile) {
  const id = `nurse-demo-${_nextNurseId++}`;
  const nurse = { id, ...profile };
  _nurses = [..._nurses, nurse];
  return nurse;
}

export function demoGetNurse(id) {
  return _nurses.find((n) => n.id === id) ?? null;
}

export function demoListNurses() {
  return [..._nurses];
}

export function demoSetVerification(id, verification) {
  _nurses = _nurses.map((n) => (n.id === id ? { ...n, verification } : n));
  return demoGetNurse(id);
}

export function demoUpdateNursePhone(id, phone) {
  _nurses = _nurses.map((n) => (n.id === id ? { ...n, phone } : n));
  return demoGetNurse(id);
}

export function demoRateNurse(id, rating) {
  _nurses = _nurses.map((n) => {
    if (n.id !== id) return n;
    const priorCount = n.shiftsCompleted ?? 0;
    const priorRating = n.rating ?? rating;
    const newRating = Math.round(((priorRating * priorCount + rating) / (priorCount + 1)) * 10) / 10;
    return { ...n, rating: newRating, shiftsCompleted: priorCount + 1 };
  });
  return demoGetNurse(id);
}

// ---------- Facilities ----------
let _facilities = [
  { id: 'facility-demo-seed', name: 'Reddington Hospital', city: 'Victoria Island, Lagos', lat: 6.4281, lng: 3.4219 },
  ...seedFacilities,
];
let _nextFacilityId = 1;

export function demoAddFacility(profile) {
  const id = `facility-demo-${_nextFacilityId++}`;
  const facility = { id, ...profile };
  _facilities = [..._facilities, facility];
  return facility;
}

export function demoGetFacility(id) {
  return _facilities.find((f) => f.id === id) ?? null;
}

export function demoListFacilities() {
  return [..._facilities];
}

export function demoUpdateFacilityLocation(id, lat, lng) {
  _facilities = _facilities.map((f) => (f.id === id ? { ...f, lat, lng } : f));
  return demoGetFacility(id);
}

export function demoUpdateFacilityPhone(id, phone) {
  _facilities = _facilities.map((f) => (f.id === id ? { ...f, phone } : f));
  return demoGetFacility(id);
}

export function demoRateFacility(id, rating) {
  _facilities = _facilities.map((f) => {
    if (f.id !== id) return f;
    const priorCount = f.ratingCount ?? 0;
    const priorRating = f.rating ?? rating;
    const newRating = Math.round(((priorRating * priorCount + rating) / (priorCount + 1)) * 10) / 10;
    return { ...f, rating: newRating, ratingCount: priorCount + 1 };
  });
  return demoGetFacility(id);
}

// ---------- Shifts ----------
let _shifts = [...mockShifts, ...seedShifts];
let _nextShiftSeq = 200;

export function demoListShifts() {
  return [..._shifts];
}

export function demoGetShift(id) {
  return _shifts.find((s) => s.id === id) ?? null;
}

export function demoListShiftsByFacility(facilityId) {
  return _shifts.filter((s) => s.facilityId === facilityId);
}

export function demoAddShift(shift) {
  const id = `SHF-${_nextShiftSeq++}`;
  const newShift = { id, status: 'open', ...shift };
  _shifts = [..._shifts, newShift];
  return newShift;
}

export function demoSetShiftStatus(id, status) {
  _shifts = _shifts.map((s) => (s.id === id ? { ...s, status } : s));
  return demoGetShift(id);
}

export function demoSetShiftLocation(id, lat, lng) {
  _shifts = _shifts.map((s) => (s.id === id ? { ...s, lat, lng } : s));
  return demoGetShift(id);
}

// ---------- Shift claims ----------
let _claims = [...mockClaims];
let _nextClaimSeq = 200;

export function demoListClaims() {
  return [..._claims];
}

export function demoGetClaim(id) {
  return _claims.find((c) => c.id === id) ?? null;
}

export function demoListClaimsByNurse(nurseId) {
  return _claims.filter((c) => c.nurseId === nurseId);
}

export function demoListClaimsByFacility(facilityId) {
  const shiftIds = new Set(_shifts.filter((s) => s.facilityId === facilityId).map((s) => s.id));
  return _claims.filter((c) => shiftIds.has(c.shiftId));
}

export function demoAddClaim(claim) {
  const id = `CLM-${_nextClaimSeq++}`;
  const newClaim = { id, status: 'pending', clockIn: null, clockOut: null, ...claim };
  _claims = [..._claims, newClaim];
  return newClaim;
}

export function demoUpdateClaim(id, patch) {
  _claims = _claims.map((c) => (c.id === id ? { ...c, ...patch } : c));
  return demoGetClaim(id);
}

// ---------- Disputes ----------
let _disputes = [];
let _nextDisputeSeq = 1;

export function demoAddDispute(dispute) {
  const id = `DSP-${_nextDisputeSeq++}`;
  const newDispute = { id, status: 'open', createdAt: Date.now(), ...dispute };
  _disputes = [..._disputes, newDispute];
  return newDispute;
}

export function demoListDisputes() {
  return [..._disputes].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function demoGetDispute(id) {
  return _disputes.find((d) => d.id === id) ?? null;
}

export function demoUpdateDispute(id, patch) {
  _disputes = _disputes.map((d) => (d.id === id ? { ...d, ...patch } : d));
  return demoGetDispute(id);
}

// ---------- Chat (demo mode) ----------
// Demo mode only ever has one identity signed in per browser tab, so this is
// a local, single-participant simulation good enough to click through the UI.
// Real two-way messaging and calling need live Firebase — see README.
let _conversations = [];
let _nextConvId = 1;
let _messages = {}; // conversationId -> array of messages
const _convListeners = new Set(); // { userId, callback }
const _msgListeners = {}; // conversationId -> Set(callback)

function _notifyConvListeners() {
  _convListeners.forEach(({ userId, callback }) => {
    callback(
      _conversations
        .filter((c) => c.participantIds.includes(userId))
        .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
    );
  });
}

function _notifyMsgListeners(conversationId) {
  (_msgListeners[conversationId] || new Set()).forEach((cb) => cb([...(_messages[conversationId] || [])]));
}

export function demoGetOrCreateConversation(me, other, opts = {}) {
  const existing = _conversations.find(
    (c) =>
      c.participantIds.includes(me.id) &&
      c.participantIds.includes(other.id) &&
      (opts.shiftId ? c.shiftId === opts.shiftId : !c.shiftId)
  );
  if (existing) return existing;

  const id = `conv-demo-${_nextConvId++}`;
  const conversation = {
    id,
    participantIds: [me.id, other.id],
    participants: [
      { id: me.id, type: me.type, name: me.name },
      { id: other.id, type: other.type, name: other.name },
    ],
    type: opts.type || 'peer',
    shiftId: opts.shiftId || null,
    lastMessage: '',
    lastMessageAt: Date.now(),
    lastSenderId: null,
    createdAt: Date.now(),
  };
  _conversations = [..._conversations, conversation];
  _messages[id] = [];
  _notifyConvListeners();
  return conversation;
}

export function demoGetConversation(id) {
  return _conversations.find((c) => c.id === id) ?? null;
}

export function demoSubscribeConversations(userId, callback) {
  const entry = { userId, callback };
  _convListeners.add(entry);
  callback(
    _conversations
      .filter((c) => c.participantIds.includes(userId))
      .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
  );
  return () => _convListeners.delete(entry);
}

export function demoSubscribeMessages(conversationId, callback) {
  if (!_msgListeners[conversationId]) _msgListeners[conversationId] = new Set();
  _msgListeners[conversationId].add(callback);
  callback([...(_messages[conversationId] || [])]);
  return () => _msgListeners[conversationId].delete(callback);
}

export function demoSendMessage(conversationId, sender, text, type = 'text') {
  const msg = {
    id: `msg-demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    senderId: sender.id,
    senderType: sender.type,
    senderName: sender.name,
    text,
    type,
    createdAt: Date.now(),
  };
  _messages[conversationId] = [...(_messages[conversationId] || []), msg];
  _conversations = _conversations.map((c) =>
    c.id === conversationId ? { ...c, lastMessage: text, lastMessageAt: Date.now(), lastSenderId: sender.id } : c
  );
  _notifyMsgListeners(conversationId);
  _notifyConvListeners();
  return msg;
}

export function demoListNurseDirectory(excludeId) {
  return _nurses.filter((n) => n.id !== excludeId && n.verification === 'verified');
}

// ---------- Presence (demo mode) ----------
// Keyed by identity id -> { id, name, type, lastActiveAt: epoch ms }.
// Used only so the admin "active users" stat has something to show while
// clicking through the app without real Firebase wired up.
let _presence = {};

export function demoTouchPresence(identity) {
  if (!identity) return;
  _presence[identity.id] = { id: identity.id, name: identity.name, type: identity.type, lastActiveAt: Date.now() };
}

export function demoListPresence() {
  return Object.values(_presence);
}
