import { DEMO_MODE, auth, db } from './firebase';
import { demoListNurses, demoSetVerification, demoAddFacility, demoAddShift } from './demoStore';

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
