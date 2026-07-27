import { createContext, useContext, useState } from 'react';
import { DEMO_MODE } from '../lib/firebase';
import { adminSignIn, adminSignOut } from '../lib/admin';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);

  async function signIn(email, password) {
    const result = await adminSignIn(email, password);
    setAdmin(result);
    return result;
  }

  async function signOut() {
    await adminSignOut();
    setAdmin(null);
  }

  return (
    <AdminContext.Provider value={{ admin, isDemo: DEMO_MODE, signIn, signOut }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
