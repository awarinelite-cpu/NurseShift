import { DEMO_MODE, db } from './firebase';
import { demoAddDispute, demoListDisputes, demoUpdateDispute, demoUpdateClaim } from './demoStore';

// Disputes are filed against a specific shift claim by either party, and
// reviewed by an admin (see AdminDisputes.jsx). Display fields (names/shift
// label) are denormalized onto the dispute at creation time so the admin
// list doesn't need extra joins across nurses/facilities/shifts.
export async function fileDispute({
  claimId,
  shiftId,
  facilityId,
  nurseId,
  reporterId,
  reporterRole, // 'nurse' | 'facility'
  reporterName,
  otherPartyName,
  shiftLabel,
  reason,
  description,
}) {
  const dispute = {
    claimId,
    shiftId,
    facilityId,
    nurseId,
    reporterId,
    reporterRole,
    reporterName,
    otherPartyName,
    shiftLabel,
    reason,
    description,
    status: 'open',
  };

  if (DEMO_MODE) {
    const created = demoAddDispute(dispute);
    demoUpdateClaim(claimId, { disputeFiled: true });
    return Promise.resolve(created);
  }

  const { collection, addDoc, doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const ref = await addDoc(collection(db, 'disputes'), { ...dispute, createdAt: serverTimestamp() });
  await updateDoc(doc(db, 'shiftClaims', claimId), { disputeFiled: true });
  return { id: ref.id, ...dispute };
}

export async function listAllDisputes() {
  if (DEMO_MODE) return Promise.resolve(demoListDisputes());

  const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
  const q = query(collection(db, 'disputes'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function resolveDispute(disputeId, status, resolutionNote = '') {
  if (DEMO_MODE) {
    demoUpdateDispute(disputeId, { status, resolutionNote, resolvedAt: Date.now() });
    return Promise.resolve(true);
  }

  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  await updateDoc(doc(db, 'disputes', disputeId), { status, resolutionNote, resolvedAt: serverTimestamp() });
  return true;
}
