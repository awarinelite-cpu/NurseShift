// One-off script to push the 70 seed facilities (50 Lagos + 20 Ogun) and
// their shifts into a LIVE Firestore project. Not used by the app itself —
// DEMO_MODE already gets this data from src/lib/seedData.js in-memory.
//
// Usage (run locally, never in a browser or committed environment):
//   1. npm install firebase-admin --save-dev
//   2. In the Firebase Console: Project settings > Service accounts >
//      "Generate new private key". Save the JSON file OUTSIDE this repo,
//      e.g. ~/nurseshift-service-account.json — never commit it.
//   3. GOOGLE_APPLICATION_CREDENTIALS=~/nurseshift-service-account.json \
//        node scripts/seedFirestore.js
//
// Each facility is written with its seed id as the Firestore document id
// (so shifts' facilityId fields line up), to the 'facilities' collection.
// Each shift is added to the 'shifts' collection with an auto id.
//
// Safe to re-run: it uses `set` (not `add`) for facilities, so re-running
// just overwrites the same 70 facility docs rather than duplicating them.
// Shifts use `add`, so re-running WILL duplicate shifts — delete the
// 'shifts' collection first if you need a clean re-seed.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { seedFacilities, seedShifts } from '../src/lib/seedData.js';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function seed() {
  console.log(`Seeding ${seedFacilities.length} facilities...`);
  const facilityBatch = db.batch();
  for (const { id, ...facility } of seedFacilities) {
    facilityBatch.set(db.collection('facilities').doc(id), facility);
  }
  await facilityBatch.commit();

  console.log(`Seeding ${seedShifts.length} shifts...`);
  // Firestore batches cap at 500 writes; chunk defensively even though 70 is well under.
  const chunkSize = 400;
  for (let i = 0; i < seedShifts.length; i += chunkSize) {
    const chunk = seedShifts.slice(i, i + chunkSize);
    const shiftBatch = db.batch();
    for (const { id, ...shift } of chunk) {
      shiftBatch.set(db.collection('shifts').doc(), shift);
    }
    await shiftBatch.commit();
  }

  console.log('Done.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
