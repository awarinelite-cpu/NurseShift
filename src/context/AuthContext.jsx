import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_MODE, auth } from '../lib/firebase';
import { signUpNurse, signOutNurse, getNurseProfile, updateNursePhone, updateNursePhoto, removeNursePhoto } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [nurse, setNurse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      // Nobody is signed in until they use the sign-up or sign-in form.
      setNurse(null);
      setLoading(false);
      return;
    }
    let unsub = () => {};
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const profile = await getNurseProfile(user.uid);
          setNurse(profile);
        } else {
          setNurse(null);
        }
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  async function signUp(fields) {
    const profile = await signUpNurse(fields);
    setNurse(profile);
    return profile;
  }

  // Called by the shared sign-in page once it knows the account is a nurse.
  function adopt(profile) {
    setNurse(profile);
  }

  async function signOut() {
    await signOutNurse();
    setNurse(null);
  }

  async function updatePhone(phone) {
    const updated = await updateNursePhone(nurse.id, phone);
    setNurse(updated);
    return updated;
  }

  async function updatePhoto(file) {
    const updated = await updateNursePhoto(nurse.id, file);
    setNurse(updated);
    return updated;
  }

  async function removePhoto() {
    const updated = await removeNursePhoto(nurse.id);
    setNurse(updated);
    return updated;
  }

  return (
    <AuthContext.Provider value={{ nurse, loading, isDemo: DEMO_MODE, signUp, adopt, signOut, updatePhone, updatePhoto, removePhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
