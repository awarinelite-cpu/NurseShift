import { DEMO_MODE, auth, db } from './firebase';
import { demoListNurses, demoSetVerification } from './demoStore';

const DEMO_ADMIN_PASSCODE = 'admin-demo';

export async function adminSignIn(email, password) {
  if (DEMO_MODE) {
    // No real backend in demo mode — the passcode stands in for admin credentials.
    if (password !== DEMO_ADMIN_PASSCODE) {
      throw new Error(`Wrong passcode. Use "${DEMO_ADMIN_PASSCODE}" in demo mode.`);
    }
    return { email, isAdmin: true };
  }

  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const { doc, getDoc } = await import('firebase/firestore');

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
  if (!adminDoc.exists()) {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    throw new Error('This account is not registered as an admin.');
  }
  return { uid: cred.user.uid, email: cred.user.email, isAdmin: true };
}

export async function adminSignOut() {
  if (DEMO_MODE) return Promise.resolve();
  const { signOut } = await import('firebase/auth');
  return signOut(auth);
}

export async function listNursesByStatus(status) {
  if (DEMO_MODE) {
    return Promise.resolve(demoListNurses().filter((n) => n.verification === status));
  }

  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'nurses'), where('verification', '==', status));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setNurseVerification(nurseId, verification) {
  if (DEMO_MODE) {
    return Promise.resolve(demoSetVerification(nurseId, verification));
  }

  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'nurses', nurseId), { verification });
  return { id: nurseId, verification };
}
