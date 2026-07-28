import { DEMO_MODE, db } from './firebase';
import {
  demoAddShift,
  demoListShiftsByFacility,
  demoSetShiftStatus,
  demoListClaimsByFacility,
  demoUpdateClaim,
  demoGetNurse,
  demoRateNurse,
  demoGetFacility,
} from './demoStore';

export async function getFacility(facilityId) {
  if (!facilityId) return null;
  if (DEMO_MODE) return Promise.resolve(demoGetFacility(facilityId));

  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'facilities', facilityId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function postShift(facility, shiftFields) {
  const shift = {
    facility: facility.name,
    facilityId: facility.id,
    city: facility.city,
    lat: facility.lat ?? null,
    lng: facility.lng ?? null,
    status: 'open',
    ...shiftFields,
  };

  if (DEMO_MODE) return Promise.resolve(demoAddShift(shift));

  const { collection, addDoc } = await import('firebase/firestore');
  const ref = await addDoc(collection(db, 'shifts'), shift);
  return { id: ref.id, ...shift };
}

export async function listShiftsForFacility(facilityId) {
  if (DEMO_MODE) return Promise.resolve(demoListShiftsByFacility(facilityId));

  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'shifts'), where('facilityId', '==', facilityId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Claims for this facility's shifts, each enriched with the shift and nurse it belongs to.
export async function listClaimsForFacility(facilityId) {
  if (DEMO_MODE) {
    const claims = demoListClaimsByFacility(facilityId);
    return Promise.resolve(
      claims.map((c) => ({
        ...c,
        nurse: demoGetNurse(c.nurseId),
        shift: demoListShiftsByFacility(facilityId).find((s) => s.id === c.shiftId),
      }))
    );
  }

  const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore');
  const shiftsSnap = await getDocs(query(collection(db, 'shifts'), where('facilityId', '==', facilityId)));
  const shifts = shiftsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const shiftIds = shifts.map((s) => s.id);
  if (shiftIds.length === 0) return [];

  // Firestore 'in' queries cap at 30 — fine for a facility's active shift list.
  const claimsSnap = await getDocs(query(collection(db, 'shiftClaims'), where('shiftId', 'in', shiftIds)));
  const claims = claimsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return Promise.all(
    claims.map(async (c) => {
      const nurseSnap = await getDoc(doc(db, 'nurses', c.nurseId));
      return {
        ...c,
        nurse: nurseSnap.exists() ? { id: nurseSnap.id, ...nurseSnap.data() } : null,
        shift: shifts.find((s) => s.id === c.shiftId),
      };
    })
  );
}

export async function approveClaim(claimId, shiftId) {
  if (DEMO_MODE) {
    demoUpdateClaim(claimId, { status: 'approved' });
    demoSetShiftStatus(shiftId, 'filled');
    return Promise.resolve(true);
  }
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'shiftClaims', claimId), { status: 'approved' });
  await updateDoc(doc(db, 'shifts', shiftId), { status: 'filled' });
  return true;
}

export async function rejectClaim(claimId, shiftId) {
  if (DEMO_MODE) {
    demoUpdateClaim(claimId, { status: 'rejected' });
    demoSetShiftStatus(shiftId, 'open'); // reopen so another nurse can claim it
    return Promise.resolve(true);
  }
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'shiftClaims', claimId), { status: 'rejected' });
  await updateDoc(doc(db, 'shifts', shiftId), { status: 'open' });
  return true;
}

export async function rateNurseForClaim(claimId, nurseId, rating, comment = '') {
  if (DEMO_MODE) {
    demoUpdateClaim(claimId, { rated: true, nurseRatingValue: rating, nurseRatingComment: comment });
    demoRateNurse(nurseId, rating);
    return Promise.resolve(true);
  }
  const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');
  await runTransaction(db, async (tx) => {
    const nurseRef = doc(db, 'nurses', nurseId);
    const nurseSnap = await tx.get(nurseRef);
    const prior = nurseSnap.exists() ? nurseSnap.data() : {};
    const priorCount = prior.shiftsCompleted ?? 0;
    const priorRating = prior.rating ?? rating;
    const newRating = Math.round(((priorRating * priorCount + rating) / (priorCount + 1)) * 10) / 10;
    tx.update(nurseRef, { rating: newRating, shiftsCompleted: priorCount + 1 });
    tx.update(doc(db, 'shiftClaims', claimId), {
      rated: true,
      nurseRatingValue: rating,
      nurseRatingComment: comment,
      ratedAt: serverTimestamp(),
    });
  });
  return true;
}
