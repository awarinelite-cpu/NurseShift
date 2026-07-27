import { DEMO_MODE, db } from './firebase';
import {
  demoListShifts,
  demoGetShift,
  demoSetShiftStatus,
  demoAddClaim,
  demoListClaimsByNurse,
  demoUpdateClaim,
} from './demoStore';

export async function listOpenShifts() {
  if (DEMO_MODE) return Promise.resolve(demoListShifts().filter((s) => s.status !== 'filled'));

  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'shifts'), where('status', '!=', 'filled'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getShift(shiftId) {
  if (DEMO_MODE) return Promise.resolve(demoGetShift(shiftId));

  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'shifts', shiftId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function claimShift(shiftId, nurseId) {
  if (DEMO_MODE) {
    demoSetShiftStatus(shiftId, 'claimed');
    const claim = demoAddClaim({ shiftId, nurseId, status: 'pending' });
    return Promise.resolve(claim);
  }

  const { collection, doc, updateDoc, addDoc, serverTimestamp } = await import('firebase/firestore');
  await updateDoc(doc(db, 'shifts', shiftId), { status: 'claimed' });
  const ref = await addDoc(collection(db, 'shiftClaims'), {
    shiftId,
    nurseId,
    status: 'pending',
    clockIn: null,
    clockOut: null,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, shiftId, nurseId, status: 'pending' };
}

export async function listMyClaims(nurseId) {
  if (DEMO_MODE) {
    const claims = demoListClaimsByNurse(nurseId);
    return Promise.resolve(claims.map((c) => ({ ...c, shift: demoGetShift(c.shiftId) })));
  }

  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'shiftClaims'), where('nurseId', '==', nurseId));
  const snap = await getDocs(q);
  const claims = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const withShifts = await Promise.all(
    claims.map(async (c) => ({ ...c, shift: await getShift(c.shiftId) }))
  );
  return withShifts;
}

export async function clockIn(claimId) {
  if (DEMO_MODE) {
    demoUpdateClaim(claimId, { clockIn: new Date().toISOString() });
    return Promise.resolve(true);
  }
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  await updateDoc(doc(db, 'shiftClaims', claimId), { clockIn: serverTimestamp() });
  return true;
}

export async function clockOut(claimId) {
  if (DEMO_MODE) {
    demoUpdateClaim(claimId, { clockOut: new Date().toISOString(), status: 'completed' });
    return Promise.resolve(true);
  }
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  await updateDoc(doc(db, 'shiftClaims', claimId), { clockOut: serverTimestamp(), status: 'completed' });
  return true;
}
