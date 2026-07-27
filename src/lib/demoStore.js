import { mockNurse, mockShifts, mockClaims } from './mockData';

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

export function demoUpdateFacilityLocation(id, lat, lng) {
  _facilities = _facilities.map((f) => (f.id === id ? { ...f, lat, lng } : f));
  return demoGetFacility(id);
}

// ---------- Shifts ----------
let _shifts = [...mockShifts];
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
