import { DEMO_MODE, auth, db } from './firebase';
import { signInNurse } from './auth';
import { signInFacility } from './facilityAuth';
import { adminSignIn } from './admin';

// One sign-in for everybody. Works out which kind of account this is
// (admin, facility or nurse) from the Firestore docs keyed by the user's uid,
// and returns { role, profile } so the caller can route to the right home.
export async function signInWithRole(email, password) {
  if (DEMO_MODE) {
    // No backend in demo mode, so the role is guessed from what was typed:
    //   password "admin-demo"      -> admin
    //   email containing "facility" -> the seeded facility
    //   anything else               -> the seeded nurse
    if (password === 'admin-demo') return { role: 'admin', profile: await adminSignIn(email, password) };
    if (/facility/i.test(email)) return { role: 'facility', profile: await signInFacility(email, password) };
    return { role: 'nurse', profile: await signInNurse(email, password) };
  }

  const { signInWithEmailAndPassword, signOut } = await import('firebase/auth');
  const { doc, getDoc } = await import('firebase/firestore');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const adminDoc = await getDoc(doc(db, 'admins', uid));
  if (adminDoc.exists()) {
    return { role: 'admin', profile: { uid, email: cred.user.email, isAdmin: true, ...adminDoc.data() } };
  }
  const facilityDoc = await getDoc(doc(db, 'facilities', uid));
  if (facilityDoc.exists()) return { role: 'facility', profile: { id: uid, ...facilityDoc.data() } };
  const nurseDoc = await getDoc(doc(db, 'nurses', uid));
  if (nurseDoc.exists()) return { role: 'nurse', profile: { id: uid, ...nurseDoc.data() } };

  await signOut(auth);
  throw new Error('Signed in, but no profile was found for this account. It may not have finished creating — try signing up again, or contact support.');
}

export const ROLE_HOME = { admin: '/admin', facility: '/facility', nurse: '/' };
