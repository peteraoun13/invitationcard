# Backend Security

## Active production backend

The OVH production build uses the PHP API when
`VITE_BACKEND_PROVIDER=php`. The older Next.js/Supabase tree remains archived
for reference and is not copied into the Vite `dist` build. Its retained RLS
policies require membership in `public.admin_users`, and its RSVP function is
service-role only. Firebase remains a selectable fallback and must keep its
Firestore and Storage rules deployed.

## Endpoint access

- Public: `GET /api/rsvp.php?token=...`
- Public token-scoped: `POST /api/rsvp.php?action=submit`
- Public token-scoped: `POST /api/uploads.php?action=upload`
- Session: `GET /api/auth.php?action=me`
- Session mutation: auth logout and password change
- Admin only: every action in `guests.php` and `dashboard.php`

Public endpoints expose only the family associated with the exact invitation
token or stored public slug. Admin mutations require an authenticated admin
session and a matching CSRF token.

## Deployment checklist

1. Use PHP 8.1 or newer and HTTPS only.
2. Keep `VITE_BACKEND_PROVIDER=php` and `VITE_API_BASE_URL=/api`.
3. Configure secrets with OVH environment variables or
   `/private/jh-invitation.php`. Use `/www/api/config.local.php` only when the
   hosting plan does not allow a file outside the web root.
4. Restrict the MySQL user to this application's database.
5. Confirm `/www/uploads/.htaccess` exists and uploads are writable by PHP.
6. Delete any old `/www/api/health.php`, backup PHP files, SQL files, or test
   upload scripts from the server.
7. Confirm unauthenticated `/api/guests.php?action=summaries` returns 401.
8. Confirm a wrong login is rate-limited after repeated attempts.
9. Test RSVP with a valid link and verify a different family ID is rejected.
10. Test an allowed image and verify `.php`, renamed scripts, oversized files,
    and mismatched extensions are rejected.
11. Deploy `firestore.rules` and `storage.rules` if Firebase fallback remains.

## Operational notes

Server logs may contain internal exception messages and must not be publicly
downloadable. Browser responses intentionally contain generic errors only.
Rotate the database password if it is ever pasted into chat, committed, or
uploaded outside the protected server configuration.
