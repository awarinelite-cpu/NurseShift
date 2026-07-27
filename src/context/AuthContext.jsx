import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_MODE, auth } from '../lib/firebase';
import { signUpNurse, signInNurse, signOutNurse, getNurseProfile } from '../lib/auth';

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

  async function signIn(email, password) {
    const profile = await signInNurse(email, password);
    setNurse(profile);
    return profile;
  }

  async function signOut() {
    await signOutNurse();
    setNurse(null);
  }

  return (
    <AuthContext.Provider value={{ nurse, loading, isDemo: DEMO_MODE, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
