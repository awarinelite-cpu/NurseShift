import { createContext, useContext, useEffect, useState } from 'react';
import { DEMO_MODE, auth, db } from '../lib/firebase';
import { adminSignOut } from '../lib/admin';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the admin session after a page reload (the admins/{uid} doc is what grants access).
  useEffect(() => {
    if (DEMO_MODE) {
      setLoading(false);
      return;
    }
    let unsub = () => {};
    Promise.all([import('firebase/auth'), import('firebase/firestore')]).then(([{ onAuthStateChanged }, { doc, getDoc }]) => {
      unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setAdmin(null);
        } else {
          try {
            const snap = await getDoc(doc(db, 'admins', user.uid));
            setAdmin(snap.exists() ? { uid: user.uid, email: user.email, isAdmin: true, ...snap.data() } : null);
          } catch {
            setAdmin(null);
          }
        }
        setLoading(false);
      });
    });
    return () => unsub();
  }, []);

  async function signOut() {
    await adminSignOut();
    setAdmin(null);
  }

  // Called by the shared sign-in page once it knows the account is an admin.
  function adopt(profile) {
    setAdmin(profile);
  }

  return (
    <AdminContext.Provider value={{ admin, loading, isDemo: DEMO_MODE, adopt, signOut }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
