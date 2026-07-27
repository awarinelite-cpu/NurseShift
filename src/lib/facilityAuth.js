import { DEMO_MODE, auth, db } from './firebase';
import { demoAddFacility, demoGetFacility } from './demoStore';

let _demoSignedInId = null;

export async function signUpFacility({ name, city, email, password }) {
  if (DEMO_MODE) {
    const facility = demoAddFacility({ name, city });
    _demoSignedInId = facility.id;
    return Promise.resolve(facility);
  }

  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const facilityProfile = { name, city, createdAt: serverTimestamp() };
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
