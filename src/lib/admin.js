import { DEMO_MODE, auth, db } from './firebase';
import {
  demoListNurses,
  demoSetVerification,
  demoAddFacility,
  demoAddShift,
  demoListFacilities,
  demoListShifts,
  demoGetFacility,
  demoUpdateFacilityLocation,
  demoListShiftsByFacility,
  demoSetShiftLocation,
} from './demoStore';
import { seedFacilities } from './seedData';

const DEMO_ADMIN_PASSCODE = 'admin-demo';

export async function adminSignIn(email, password) {
  if (DEMO_MODE) {
    // No real backend in demo mode — the passcode stands in for admin credentials.
    if (password !== DEMO_ADMIN_PASSCODE) {
      throw new Error(`Wrong passcode. Use "${DEMO_ADMIN_PASSCODE}" in demo mode.`);
    }
    return { email, isAdmin: true };
  }

  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const { doc, getDoc } = await import('firebase/firestore');

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
  if (!adminDoc.exists()) {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    throw new Error('This account is not registered as an admin.');
  }
  return { uid: cred.user.uid, email: cred.user.email, isAdmin: true };
}

export async function adminSignOut() {
  if (DEMO_MODE) return Promise.resolve();
  const { signOut } = await import('firebase/auth');
  return signOut(auth);
}

export async function listNursesByStatus(status) {
  if (DEMO_MODE) {
    return Promise.resolve(demoListNurses().filter((n) => n.verification === status));
  }

  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const q = query(collection(db, 'nurses'), where('verification', '==', status));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function setNurseVerification(nurseId, verification) {
  if (DEMO_MODE) {
    return Promise.resolve(demoSetVerification(nurseId, verification));
  }

  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'nurses', nurseId), { verification });
  return { id: nurseId, verification };
}

// Lists every facility with how many shifts it has posted, newest facility
// first where we can tell (Firestore keeps insertion order roughly via id
// only in demo mode; live mode has no createdAt on older docs, so this is
// a best-effort ordering, not a guarantee).
export async function listFacilitiesForAdmin() {
  if (DEMO_MODE) {
    const facilities = demoListFacilities();
    const shifts = demoListShifts();
    return facilities
      .map((f) => ({ ...f, shiftCount: shifts.filter((s) => s.facilityId === f.id).length }))
      .reverse();
  }

  const { collection, getDocs } = await import('firebase/firestore');
  const [facilitiesSnap, shiftsSnap] = await Promise.all([
    getDocs(collection(db, 'facilities')),
    getDocs(collection(db, 'shifts')),
  ]);
  const facilities = facilitiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const shifts = shiftsSnap.docs.map((d) => d.data());
  return facilities
    .map((f) => ({ ...f, shiftCount: shifts.filter((s) => s.facilityId === f.id).length }))
    .reverse();
}

// Reads any facility by id, regardless of whether it has a matching auth
// account — unlike getFacilityProfile in facilityAuth.js, this isn't scoped
// to "the currently signed-in facility". Used by the admin facility detail page.
export async function getFacilityById(facilityId) {
  if (DEMO_MODE) return Promise.resolve(demoGetFacility(facilityId));

  const { doc, getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'facilities', facilityId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Creates a single facility, and optionally one open shift for it if unit +
// date are supplied. Shares validation and shift-defaulting with
// bulkImportFacilities below — kept as a thin wrapper over the same path so
// the single-add form and CSV import can never drift out of sync.
export async function createFacility(fields) {
  const { created, skipped } = await bulkImportFacilities([fields]);
  if (skipped.length > 0) {
    throw new Error(skipped[0].reason);
  }
  return created[0];
}

// Bulk-creates facilities (and one shift each, if shift fields are present on
// the row) from parsed CSV rows. Each row shape — see parseFacilityCsv in
// src/lib/csv.js for the exact columns expected.
// Returns { created, skipped } where skipped holds { row, reason } entries
// for rows that failed validation, so the admin UI can show what to fix.
export async function bulkImportFacilities(rows) {
  const created = [];
  const skipped = [];

  const valid = [];
  for (const row of rows) {
    if (!row.name || !row.city) {
      skipped.push({ row, reason: 'Missing name or city' });
      continue;
    }
    const lat = row.lat === '' || row.lat == null ? null : Number(row.lat);
    const lng = row.lng === '' || row.lng == null ? null : Number(row.lng);
    if ((row.lat && Number.isNaN(lat)) || (row.lng && Number.isNaN(lng))) {
      skipped.push({ row, reason: 'lat/lng must be numbers' });
      continue;
    }
    valid.push({ ...row, lat, lng });
  }

  if (DEMO_MODE) {
    for (const row of valid) {
      const facility = demoAddFacility({ name: row.name, city: row.city, lat: row.lat, lng: row.lng });
      if (row.unit && row.date) {
        demoAddShift({
          facility: facility.name,
          facilityId: facility.id,
          city: facility.city,
          lat: facility.lat,
          lng: facility.lng,
          unit: row.unit,
          cadre: row.cadre || 'RN',
          date: row.date,
          start: row.start || '07:00',
          end: row.end || '19:00',
          hours: row.hours ? Number(row.hours) : 12,
          rate: row.rate ? Number(row.rate) : 8000,
          urgency: row.urgency || 'normal',
          facilityRating: 4.5,
        });
      }
      created.push(facility);
    }
    return { created, skipped };
  }

  const { collection, doc, writeBatch } = await import('firebase/firestore');
  // Firestore batches cap at 500 writes; a facility + its shift is 2 writes,
  // so chunk at 200 rows to stay comfortably under that per batch.
  const chunkSize = 200;
  for (let i = 0; i < valid.length; i += chunkSize) {
    const chunk = valid.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    for (const row of chunk) {
      const facilityRef = doc(collection(db, 'facilities'));
      const facility = { name: row.name, city: row.city, lat: row.lat, lng: row.lng };
      batch.set(facilityRef, facility);

      if (row.unit && row.date) {
        const shiftRef = doc(collection(db, 'shifts'));
        batch.set(shiftRef, {
          facility: row.name,
          facilityId: facilityRef.id,
          city: row.city,
          lat: row.lat,
          lng: row.lng,
          unit: row.unit,
          cadre: row.cadre || 'RN',
          date: row.date,
          start: row.start || '07:00',
          end: row.end || '19:00',
          hours: row.hours ? Number(row.hours) : 12,
          rate: row.rate ? Number(row.rate) : 8000,
          status: 'open',
          urgency: row.urgency || 'normal',
        });
      }

      created.push({ id: facilityRef.id, ...facility });
    }
    await batch.commit();
  }

  return { created, skipped };
}

// Patches corrected lat/lng from src/lib/seedData.js onto the matching
// facility docs (by seed id) and their shifts (by facilityId, since live
// shift docs have auto-generated ids, not the seed ids). Runs under the
// signed-in admin's session — no service-account script needed. Only the
// lat/lng fields are touched; everything else (status, claims, ratings)
// is left alone. Skips any seed facility that doesn't exist in Firestore
// (e.g. it was never seeded) rather than creating it.
export async function fixSeedFacilityCoordinates() {
  let facilitiesUpdated = 0;
  let facilitiesSkipped = 0;
  let shiftsUpdated = 0;

  if (DEMO_MODE) {
    for (const { id, lat, lng } of seedFacilities) {
      const facility = demoGetFacility(id);
      if (!facility) {
        facilitiesSkipped++;
        continue;
      }
      demoUpdateFacilityLocation(id, lat, lng);
      facilitiesUpdated++;
      for (const shift of demoListShiftsByFacility(id)) {
        demoSetShiftLocation(shift.id, lat, lng);
        shiftsUpdated++;
      }
    }
    return { facilitiesUpdated, facilitiesSkipped, shiftsUpdated };
  }

  const { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } =
    await import('firebase/firestore');

  for (const { id, lat, lng } of seedFacilities) {
    const facilityRef = doc(db, 'facilities', id);
    const facilitySnap = await getDoc(facilityRef);
    if (!facilitySnap.exists()) {
      facilitiesSkipped++;
      continue;
    }

    await updateDoc(facilityRef, { lat, lng });
    facilitiesUpdated++;

    const shiftsSnap = await getDocs(query(collection(db, 'shifts'), where('facilityId', '==', id)));
    if (shiftsSnap.empty) continue;

    const batch = writeBatch(db);
    shiftsSnap.docs.forEach((shiftDoc) => {
      batch.update(shiftDoc.ref, { lat, lng });
    });
    await batch.commit();
    shiftsUpdated += shiftsSnap.size;
  }

  return { facilitiesUpdated, facilitiesSkipped, shiftsUpdated };
}
