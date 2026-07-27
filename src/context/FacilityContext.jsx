import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_MODE, auth } from '../lib/firebase';
import { signUpFacility, signInFacility, signOutFacility, getFacilityProfile } from '../lib/facilityAuth';

const FacilityContext = createContext(null);

export function FacilityProvider({ children }) {
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEMO_MODE) {
      setFacility(null);
      setLoading(false);
      return;
    }
    let unsub = () => {};
    import('firebase/auth').then(({ onAuthStateChanged }) => {
      unsub = onAuthStateChanged(auth, async (user) => {
        setFacility(user ? await getFacilityProfile(user.uid) : null);
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  async function signUp(fields) {
    const profile = await signUpFacility(fields);
    setFacility(profile);
    return profile;
  }

  async function signIn(email, password) {
    const profile = await signInFacility(email, password);
    setFacility(profile);
    return profile;
  }

  async function signOut() {
    await signOutFacility();
    setFacility(null);
  }

  return (
    <FacilityContext.Provider value={{ facility, loading, isDemo: DEMO_MODE, signUp, signIn, signOut }}>
      {children}
    </FacilityContext.Provider>
  );
}

export function useFacility() {
  return useContext(FacilityContext);
}
