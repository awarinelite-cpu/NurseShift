import { DEMO_MODE, db } from './firebase';
import { demoUpdateClaim, demoRateFacility } from './demoStore';

// The other half of rateNurseForClaim (lib/facility.js) — a nurse rating the
// facility after a completed shift. Kept in its own module since it's used
// from the nurse-facing surface rather than the facility surface.
export async function rateFacilityForClaim(claimId, facilityId, rating, comment = '') {
  if (DEMO_MODE) {
    demoUpdateClaim(claimId, { facilityRated: true, facilityRatingValue: rating, facilityRatingComment: comment });
    demoRateFacility(facilityId, rating);
    return Promise.resolve(true);
  }

  const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');
  await runTransaction(db, async (tx) => {
    const facilityRef = doc(db, 'facilities', facilityId);
    const facilitySnap = await tx.get(facilityRef);
    const prior = facilitySnap.exists() ? facilitySnap.data() : {};
    const priorCount = prior.ratingCount ?? 0;
    const priorRating = prior.rating ?? rating;
    const newRating = Math.round(((priorRating * priorCount + rating) / (priorCount + 1)) * 10) / 10;
    tx.update(facilityRef, { rating: newRating, ratingCount: priorCount + 1 });
    tx.update(doc(db, 'shiftClaims', claimId), {
      facilityRated: true,
      facilityRatingValue: rating,
      facilityRatingComment: comment,
      facilityRatedAt: serverTimestamp(),
    });
  });
  return true;
}
