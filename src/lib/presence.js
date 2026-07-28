import { DEMO_MODE, db } from './firebase';
import { demoTouchPresence } from './demoStore';

// A user counts as "active" if we've heard from them within this window.
// Firestore has no built-in "online" concept (that needs Realtime Database
// presence + onDisconnect), so this app approximates it: each signed-in
// client writes a heartbeat on a timer, and anyone who's stopped heartbeating
// simply ages out of the "active" window on the admin dashboard.
export const ACTIVE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

async function writeHeartbeat(identity) {
  if (DEMO_MODE) {
    demoTouchPresence(identity);
    return;
  }
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
  await setDoc(
    doc(db, 'presence', identity.id),
    { name: identity.name, type: identity.type, lastActiveAt: serverTimestamp() },
    { merge: true }
  ).catch(() => {
    // Best-effort — presence is a nice-to-have stat, never block the app on it.
  });
}

// Call once per signed-in session (nurse or facility). Writes an immediate
// heartbeat, then repeats on a timer for as long as the component using it
// stays mounted. Returns a cleanup function.
export function startPresenceHeartbeat(identity) {
  if (!identity) return () => {};
  writeHeartbeat(identity);
  const interval = setInterval(() => writeHeartbeat(identity), HEARTBEAT_INTERVAL_MS);
  return () => clearInterval(interval);
}
