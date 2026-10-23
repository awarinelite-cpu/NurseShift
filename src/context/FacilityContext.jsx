import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_MODE, auth } from '../lib/firebase';
import { signUpFacility, signOutFacility, getFacilityProfile, updateFacilityLocation, updateFacilityPhone } from '../lib/facilityAuth';

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

  // Called by the shared sign-in page once it knows the account is a facility.
  function adopt(profile) {
    setFacility(profile);
  }

  async function signOut() {
    await signOutFacility();
    setFacility(null);
  }

  async function updateLocation(lat, lng) {
    const updated = await updateFacilityLocation(facility.id, lat, lng);
    setFacility(updated);
    return updated;
  }

  async function updatePhone(phone) {
    const updated = await updateFacilityPhone(facility.id, phone);
    setFacility(updated);
    return updated;
  }

  return (
    <FacilityContext.Provider value={{ facility, loading, isDemo: DEMO_MODE, signUp, adopt, signOut, updateLocation, updatePhone }}>
      {children}
    </FacilityContext.Provider>
  );
}

export function useFacility() {
  return useContext(FacilityContext);
}
