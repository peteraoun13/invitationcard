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

## OVH PHP/MySQL Backend

This project can now run with either backend:

```env
VITE_BACKEND_PROVIDER=php
VITE_API_BASE_URL=/api
VITE_PUBLIC_SITE_URL=https://jh-2026.com
```

To switch back to Firebase later:

```env
VITE_BACKEND_PROVIDER=firebase
```

Firebase files are still kept in `src/lib/*`, `firebase.json`, and `firestore.rules`.

### OVH Folder Layout

Upload the React build contents directly into `/www`, not the `dist` folder itself.

Correct:

```txt
/www/index.html
/www/assets/
/www/fonts/
/www/api/
/www/uploads/
/www/.htaccess
```

Wrong:

```txt
/www/dist/index.html
```

### Database Setup

1. In OVH Manager, create a MySQL database for the hosting plan.
2. Open phpMyAdmin from OVH.
3. Import `api/database/schema.sql`.
4. Create the first admin password hash locally:

```bash
php -r "echo password_hash('YOUR_STRONG_PASSWORD', PASSWORD_DEFAULT), PHP_EOL;"
```

5. In phpMyAdmin, insert the admin user:

```sql
INSERT INTO dashboard_users (email, password_hash, role)
VALUES ('your@email.com', 'PASTE_HASH_HERE', 'admin');
```

### PHP Config

Use PHP 8.1 or newer. Keep secrets out of React/Vite variables. The preferred
OVH setup is to copy `api/config.local.example.php` outside the public `/www`
folder as:

```txt
/private/jh-invitation.php
```

The API discovers that path automatically. If your OVH plan does not allow a
private folder beside `/www`, use the protected fallback:

```txt
/www/api/config.local.php
```

Then put the real values only in that server file:

```php
<?php

return [
    'app' => [
        'environment' => 'production',
        'allowed_origins' => ['https://jh-2026.com'],
    ],
    'db' => [
        'host' => 'your_ovh_db_host',
        'port' => 3306,
        'name' => 'your_db_name',
        'user' => 'your_db_user',
        'password' => 'your_db_password',
    ],
    'security' => [
        'secure_cookie' => true,
        'session_idle_timeout' => 1800,
        'session_absolute_timeout' => 28800,
    ],
];
```

`config.local.php` is ignored by Git and blocked by the API `.htaccess`. You can
also point to another private file with `APP_CONFIG_FILE`. If OVH provides
server environment variables, use `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER`, `DB_PASSWORD`, and `ALLOWED_ORIGINS` instead. Environment variables
take precedence over the local config file.

Never use `VITE_` for a database password. Every `VITE_` value is public in the
built browser JavaScript.

### Upload With FileZilla

After `npm run build`, upload:

```txt
dist/* -> /www/
```

The build already copies the secured `api/` and `uploads/` folders into `dist`.
Do not delete `/www/api/config.local.php` during future uploads. Make sure
`/www/uploads` is writable by PHP; prefer hosting-managed permissions or `0755`
and do not use `0777` unless OVH explicitly requires it.

### Test

An unauthenticated request to this URL must return HTTP 401:

```txt
https://jh-2026.com/api/guests.php?action=summaries
```

Then open:

```txt
https://jh-2026.com/admin/login
```

Successful login confirms that PHP sessions and the database connection work.
The old public `api/health.php` diagnostic is intentionally removed; delete any
old copy still present on OVH.

### PHP Server Variables

These values can be supplied as OVH environment variables or in the protected
local config where applicable:

```env
APP_ENV=production
APP_CONFIG_FILE=/private/jh-invitation.php
ALLOWED_ORIGINS=https://jh-2026.com
DB_HOST=your_ovh_database_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_username
DB_PASSWORD=your_database_password
SESSION_SECURE_COOKIE=true
SESSION_IDLE_TIMEOUT=1800
SESSION_ABSOLUTE_TIMEOUT=28800
MAX_JSON_BODY_SIZE=65536
MAX_UPLOAD_SIZE=26214400
MAX_UPLOAD_FILES=10
```

Optional advanced settings are `SESSION_SAVE_PATH`, `RATE_LIMIT_DIR`, and
`UPLOAD_DIR`. Database credentials should belong to a user with access only to
this application's database, not to unrelated Joomla or hosting databases.

### Security Notes

- PHP uses PDO prepared statements.
- Admin passwords use `password_hash()` and `password_verify()`.
- Admin sessions use Secure, HttpOnly, SameSite cookies, idle/absolute expiry,
  session ID regeneration, and CSRF tokens.
- Login and public write endpoints have IP-aware, server-side rate limits.
- API requests reject unknown origins and unsupported methods.
- Private API responses use `no-store` and defensive security headers.
- `/api/config*.php`, internal helpers, SQL, and backup files are blocked by
  `/api/.htaccess`.
- `/uploads/.htaccess` blocks executable scripts and content sniffing.
- Public uploads pair each extension with its MIME type, limit count/size/image
  dimensions, use random names, and roll back partial failures.
- Public RSVP and upload access is scoped to an exact invite token/public slug.

If Firebase remains available as a fallback, deploy both rule sets:

```bash
firebase deploy --only firestore:rules,storage
```

Firebase Storage is currently denied completely because the Firebase upload
feature is not implemented. Do not open Storage rules until a scoped upload
flow is added.

## Archived Next/Supabase Work

The older Next.js/Supabase files were not deleted. They are still available in place and can be removed later after the Firebase direction is fully approved.

Old commands are preserved:

```bash
npm run next:dev
npm run next:build
npm run next:start
```

If this archived Supabase backend is reactivated, rerun `supabase/schema.sql`
and authorize each admin UID explicitly:

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'your-admin@email.com'
on conflict (user_id) do nothing;
```

The archived policies now use `public.is_admin()`; merely having a Supabase
account no longer grants dashboard access. Its public RSVP action is server-side
and the RSVP database function is executable only by the service role.
