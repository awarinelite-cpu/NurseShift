import { DEMO_MODE, auth, db, storage } from './firebase';
import { demoAddNurse, demoGetNurse } from './demoStore';

// --- Demo-mode: tracks which nurse (if any) is "signed in" this session ---
let _demoSignedInId = null;

export async function signUpNurse({ name, email, password, cadre, specialty, yearsExperience, licenseNumber, licenseFile }) {
  if (DEMO_MODE) {
    const nurse = demoAddNurse({
      name,
      cadre,
      specialty,
      yearsExperience: Number(yearsExperience),
      licenseNumber,
      verification: 'pending',
      rating: null,
      shiftsCompleted: 0,
      licenseFileName: licenseFile?.name ?? null,
    });
    _demoSignedInId = nurse.id;
    return Promise.resolve(nurse);
  }

  const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  let licenseFileUrl = null;
  let licenseFileName = null;
  if (licenseFile) {
    const path = `license-documents/${cred.user.uid}/${licenseFile.name}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, licenseFile);
    licenseFileUrl = await getDownloadURL(storageRef);
    licenseFileName = licenseFile.name;
  }

  const nurseProfile = {
    name,
    cadre,
    specialty,
    yearsExperience: Number(yearsExperience),
    licenseNumber,
    verification: 'pending', // an admin flips this to "verified" after manual review
    rating: null,
    shiftsCompleted: 0,
    licenseFileUrl,
    licenseFileName,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'nurses', cred.user.uid), nurseProfile);
  return { id: cred.user.uid, ...nurseProfile };
}

export async function signInNurse(email, password) {
  if (DEMO_MODE) {
    // Demo mode has no real credential check — sign in as the seeded verified nurse.
    _demoSignedInId = 'nurse-demo-01';
    return Promise.resolve(demoGetNurse('nurse-demo-01'));
  }
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return getNurseProfile(cred.user.uid);
}

export async function signOutNurse() {
  if (DEMO_MODE) {
    _demoSignedInId = null;
    return Promise.resolve();
  }
  const { signOut } = await import('firebase/auth');
  return signOut(auth);
}

export async function getNurseProfile(uid) {
  if (DEMO_MODE) return Promise.resolve(_demoSignedInId ? demoGetNurse(_demoSignedInId) : null);

  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'nurses', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
