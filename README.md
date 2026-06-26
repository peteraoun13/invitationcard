# Wedding Invitation RSVP System

React/Vite wedding invitation system with Firebase Auth, Firestore, private family invite links, admin management, and RSVP submission.

The finished invitation design remains in `src/components/InvitationCard.jsx`, `src/components/EnvelopeIntro.jsx`, and `src/App.css`. The visual invitation was not redesigned. The previous Next.js/Supabase work is still kept in `app/`, `components/`, `lib/`, `supabase/`, and `types/` for now.

## Stack

- React/Vite
- Firebase Auth
- Firestore Database
- Firebase Storage later if needed
- Vercel deployment

## Environment Variables

Create `.env.local`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_PUBLIC_SITE_URL=https://card-psi.vercel.app
```

When the custom domain is connected, change only:

```bash
VITE_PUBLIC_SITE_URL=https://jadandhala.com
```

The app never hardcodes the Vercel URL. Invite links are generated as:

```text
${VITE_PUBLIC_SITE_URL}/invite/${inviteToken}
```

## Firebase Setup

1. Create a Firebase project.
2. Open Project settings, then Web app.
3. Copy the Firebase config values into `.env.local`.
4. Open Authentication, enable Email/Password.
5. Do not build or enable a public signup page.
6. Create the bride/groom/admin user manually in Firebase Auth.
7. Copy that user's UID.
8. In Firestore, create a collection named `admins`.
9. Add a document whose document ID is the admin user's UID.
10. Add any small field, for example:

```json
{
  "role": "admin"
}
```

Only authenticated users with an `admins/{uid}` document can access or write admin data.

## Firestore Data

Families:

```text
families/{inviteToken}
```

Fields:

- `familyName`
- `inviteToken`
- `createdAt`
- `updatedAt`

Guests:

```text
families/{inviteToken}/guests/{guestId}
```

Fields:

- `name`
- `attending`
- `responded`
- `createdAt`
- `updatedAt`

RSVP submissions:

```text
rsvpSubmissions/{submissionId}
```

Fields:

- `familyId`
- `inviteToken`
- `submittedAt`
- `responses`

The family document ID is the invite token. This lets public guests open `/invite/:token` without allowing public browsing of all families.

## Firestore Rules

Rules are in:

```text
firestore.rules
```

Deploy them with Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

The rules:

- Allow admins to manage families and guests.
- Allow public users to read only the family document whose ID matches their invite token.
- Allow public users to read guests only inside that family.
- Allow public users to submit an RSVP and update only RSVP status fields.
- Block public browsing of all families.

## Local Development

Install dependencies:

```bash
npm install
```

Run Vite:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/admin/login
```

The normal invitation remains available at:

```text
http://localhost:5173/
```

Private invite links look like:

```text
https://card-psi.vercel.app/invite/nassar-a8k92
```

## Admin Flow

Routes:

- `/admin/login`
- `/admin`
- `/admin/families`
- `/admin/families/:familyId`

Admin can:

- See total families.
- See total guests.
- See attending, not attending, and pending counts.
- Create/edit/delete families.
- Generate and copy private invite links.
- Add/edit/delete guests.
- See RSVP status per guest.

## Public RSVP Flow

Route:

```text
/invite/:token
```

The page:

- Loads the family by invite token from Firestore.
- Opens the existing envelope, video, music, countdown, and story invitation flow.
- Replaces the hardcoded RSVP guest list with that family's guests.
- Saves RSVP responses to Firestore.
- Shows a confirmation message after submission.
- Hides the RSVP section if that family link already responded.

## Vercel Deployment

1. Push the project to GitHub.
2. Import the project in Vercel.
3. Set Framework Preset to Vite.
4. Set Build Command:

```bash
npm run build
```

5. Set Output Directory:

```text
dist
```

6. Add the Vite environment variables in Vercel Project Settings.
7. Deploy.
8. Test `/admin/login`.
9. Create a family and guests.
10. Copy the generated Vercel invite link.
11. Test the private `/invite/:token` link on iPhone and WhatsApp browser.

The `vercel.json` rewrite keeps direct browser visits to `/admin` and `/invite/:token` working in the Vite single-page app.

## Archived Next/Supabase Work

The older Next.js/Supabase files were not deleted. They are still available in place and can be removed later after the Firebase direction is fully approved.

Old commands are preserved:

```bash
npm run next:dev
npm run next:build
npm run next:start
```
