# NurseShift

A shift marketplace connecting Nigerian hospitals/facilities with verified nurses.
This first slice covers the **nurse-facing flow**: browse open shifts, view details,
claim a shift, then track it in My Shifts (approval → clock in → clock out).

## Status: demo mode by default

The app runs immediately with no backend, using mock data in `src/lib/mockData.js`
and an in-memory store in `src/lib/shifts.js`. A demo banner shows at the top
whenever this is active. This lets you click through the whole flow before wiring
up Firebase.

## Run it

```bash
npm install
npm run dev
```

## Go live with Firebase

1. Create a Firebase project → enable **Authentication** (Email/Password),
   **Firestore**, and **Storage**.
2. Copy `.env.example` to `.env.local` and fill in your web app config.
3. Restart the dev server. `DEMO_MODE` in `src/lib/firebase.js` flips off
   automatically once `VITE_FIREBASE_API_KEY` is set, and every read/write in
   `src/lib/shifts.js` and `src/lib/auth.js` switches from mock data to real
   Firebase Auth / Firestore / Storage calls.

### Nurse sign-up flow

`/signup` collects name, email, password, cadre, specialty, years of experience,
NMCN license number, and an **optional** license document (PDF/JPG/PNG, 8MB
max). The document upload is optional because Firebase Storage now requires
the Blaze (pay-as-you-go) plan even for light usage — if your project is still
on Spark, sign-up still works fine, just without the file attached. If a file
is attached and the Storage upload fails or hangs (e.g. Storage isn't
provisioned), sign-up continues anyway after a timeout rather than getting
stuck — the account and profile still save, and the license file can be
requested separately. On submit:

1. Creates the account with `createUserWithEmailAndPassword`.
2. If a file was attached and Storage is available, uploads it to
   `license-documents/{uid}/{filename}`.
3. Writes a `nurses/{uid}` Firestore doc with `verification: "pending"`.

Nobody can claim shifts until an admin flips `verification` to `"verified"` —
that review step isn't built yet (see below). `/login` and route protection
(`src/components/RequireAuth.jsx`) are wired up so the Duty Board, My Shifts,
and Profile all require a signed-in nurse.

**Storage security rules** — lock license documents down so only the owner
and your (future) admin tooling can read them:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /license-documents/{uid}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 8 * 1024 * 1024;
    }
  }
}
```

**Storage security rules** — lock license documents down so only the owner
and your (future) admin tooling can read them. A ready-to-deploy version is
in `storage.rules` at the repo root:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /license-documents/{uid}/{fileName} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 8 * 1024 * 1024;
    }
  }
}
```

**Firestore rules** — a starting-point version is in `firestore.rules` at the
repo root, with the known gaps called out in comments (a nurse can currently
self-verify via a raw write; facility rating writes aren't modeled as a
distinct role yet). Deploy either with the Firebase CLI:

```bash
firebase deploy --only firestore:rules,storage:rules
```

or paste them into Console → Firestore/Storage → Rules directly.

### Facility dashboard

`/facility/signup` and `/facility/login` are a separate account type from
nurses, with their own layout and nav (`/facility` for claims, `/facility/post`
to post a shift). In demo mode, signing up creates a facility in local state;
signing in always lands you on the seeded demo facility (Reddington Hospital),
which already owns one shift so there's something to see immediately.

The loop that ties everything together:

1. Facility posts a shift at `/facility/post` → it appears on the nurse Duty Board.
2. A verified nurse claims it → the claim shows up under **Awaiting your
   decision** on `/facility`.
3. Facility **approves** → shift flips to `filled`, claim flips to `approved`,
   and the nurse can now clock in from My Shifts. Facility **rejects** →
   shift reopens (`open`) so another nurse can claim it.
4. After the nurse clocks out (claim `status: "completed"`), the claim shows
   under **Rate the nurse** — a 1–5 star rating updates the nurse's profile
   rating and shift count.

### Admin license review

`/admin/login` is a separate, unlinked surface (not in the nurse nav) for staff
to review pending licenses. In demo mode, any email works with the passcode
`admin-demo`. Once you sign up a nurse via `/signup`, they show up at `/admin`
with their license document and can be approved or rejected — approval flips
their `verification` to `"verified"`, which immediately unlocks claiming on
their account.

In live mode, admin access requires a matching doc at `admins/{uid}` in
Firestore — create that doc by hand (or via a Cloud Function) for each staff
account after they sign up through Firebase Auth. There's no self-serve admin
sign-up on purpose.

### Firestore collections this expects

```
shifts/{shiftId}
  facility, facilityId, city, unit, cadre, date, start, end, hours,
  rate, status ("open" | "claimed" | "filled"), urgency, facilityRating

shiftClaims/{claimId}
  shiftId, nurseId, status ("pending" | "approved" | "rejected" | "completed"),
  clockIn (timestamp | null), clockOut (timestamp | null), rated (bool), createdAt

nurses/{nurseId}
  name, cadre, specialty, yearsExperience, licenseNumber,
  verification ("verified" | "pending" | "rejected"), rating, shiftsCompleted,
  licenseFileUrl, licenseFileName, createdAt

facilities/{facilityId}
  name, city, createdAt

admins/{uid}
  presence of this doc (any shape) grants admin access — create manually per staff account
```

Recommended: a Cloud Function that flips a shift's `status` to `filled` once a
facility approves a claim, and rejects/reopens it if the facility declines.

### Not yet built (next slices)

- Rejection reason + resubmission flow for nurses whose license is rejected
- Proper transactional averaging for nurse ratings in live mode (current live-mode
  `rateNurseForClaim` is a simplified first cut — see the comment in `src/lib/facility.js`)
- Payment (Paystack) integration for facility → platform → nurse payout
- Push notifications (claim approved, license verified, shift reminder) via FCM
- Android packaging via Capacitor, matching the existing app pattern

## Design

Palette and type choices are in `src/index.css` (tokens) and `src/styles.css`
(components). The duty board list is styled after a hospital shift roster /
departures-board look — deep navy, a gold accent for pay, monospace for shift
codes and timestamps — rather than a generic dashboard template.
