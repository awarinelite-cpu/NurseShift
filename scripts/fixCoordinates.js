// One-off script to patch corrected lat/lng onto facility and shift
// documents that ALREADY EXIST in a live Firestore project — without
// duplicating or deleting anything.
//
// Why this exists instead of re-running seedFirestore.js: that script
// uses `set` for facilities (safe to re-run) but `add` for shifts, so
// re-running it would duplicate every shift in the 'shifts' collection,
// including ones nurses may have already claimed. This script instead:
//   - updates only the lat/lng fields on each facilities/{seedId} doc
//   - finds shifts by facilityId (their real Firestore doc IDs are
//     auto-generated, not the seed IDs) and updates only their lat/lng
//
// Everything else on each document (status, claims, ratings, etc.) is
// left untouched.
//
// Usage (run locally, never in a browser or committed environment):
//   1. npm install firebase-admin --save-dev   (skip if already installed)
//   2. In the Firebase Console: Project settings > Service accounts >
//      "Generate new private key". Save the JSON file OUTSIDE this repo,
//      e.g. ~/nurseshift-service-account.json — never commit it.
//   3. GOOGLE_APPLICATION_CREDENTIALS=~/nurseshift-service-account.json \
//        node scripts/fixCoordinates.js
//
// Safe to re-run.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { seedFacilities } from '../src/lib/seedData.js';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function fixCoordinates() {
  let facilitiesUpdated = 0;
  let facilitiesMissing = 0;
  let shiftsUpdated = 0;

  for (const { id, lat, lng } of seedFacilities) {
    const facilityRef = db.collection('facilities').doc(id);
    const facilitySnap = await facilityRef.get();

    if (!facilitySnap.exists) {
      facilitiesMissing++;
      continue;
    }

    await facilityRef.update({ lat, lng });
    facilitiesUpdated++;

    // Shift docs have auto-generated IDs in live Firestore (unlike demo
    // mode), so find them by facilityId instead.
    const shiftsSnap = await db.collection('shifts').where('facilityId', '==', id).get();
    if (shiftsSnap.empty) continue;

    const batch = db.batch();
    shiftsSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { lat, lng });
    });
    await batch.commit();
    shiftsUpdated += shiftsSnap.size;
  }

  console.log(`Facilities updated: ${facilitiesUpdated}`);
  console.log(`Facilities not found in Firestore (skipped): ${facilitiesMissing}`);
  console.log(`Shifts updated: ${shiftsUpdated}`);
}

fixCoordinates().catch((err) => {
  console.error('Fix failed:', err);
  process.exit(1);
});
