import { DEMO_MODE, auth, db } from './firebase';
import { demoAddFacility, demoGetFacility, demoUpdateFacilityLocation, demoUpdateFacilityPhone } from './demoStore';

let _demoSignedInId = null;

export async function signUpFacility({ name, city, email, password, phone, lat, lng }) {
  if (DEMO_MODE) {
    const facility = demoAddFacility({ name, city, phone: phone || null, lat: lat ?? null, lng: lng ?? null });
    _demoSignedInId = facility.id;
    return Promise.resolve(facility);
  }

  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const facilityProfile = { name, city, phone: phone || null, lat: lat ?? null, lng: lng ?? null, createdAt: serverTimestamp() };
  await setDoc(doc(db, 'facilities', cred.user.uid), facilityProfile);
  return { id: cred.user.uid, ...facilityProfile };
}

export async function signInFacility(email, password) {
  if (DEMO_MODE) {
    _demoSignedInId = 'facility-demo-seed';
    return Promise.resolve(demoGetFacility('facility-demo-seed'));
  }
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return getFacilityProfile(cred.user.uid);
}

export async function signOutFacility() {
  if (DEMO_MODE) {
    _demoSignedInId = null;
    return Promise.resolve();
  }
  const { signOut } = await import('firebase/auth');
  return signOut(auth);
}

export async function getFacilityProfile(uid) {
  if (DEMO_MODE) return Promise.resolve(_demoSignedInId ? demoGetFacility(_demoSignedInId) : null);

  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'facilities', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Lets a facility set/update its location after the fact — covers accounts
// created before location capture existed, or ones that skipped it at sign-up.
export async function updateFacilityLocation(facilityId, lat, lng) {
  if (DEMO_MODE) return Promise.resolve(demoUpdateFacilityLocation(facilityId, lat, lng));

  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'facilities', facilityId), { lat, lng });
  return getFacilityProfile(facilityId);
}

// Lets a facility add/update its phone number after the fact — this is the
// number the direct-call fallback dials when a free in-app voice call can't
// connect (see src/context/CallContext.jsx).
export async function updateFacilityPhone(facilityId, phone) {
  if (DEMO_MODE) return Promise.resolve(demoUpdateFacilityPhone(facilityId, phone || null));

  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'facilities', facilityId), { phone: phone || null });
  return getFacilityProfile(facilityId);
}
