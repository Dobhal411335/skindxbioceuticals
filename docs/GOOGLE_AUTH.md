# Google Authentication

Customer Google signup/signin for the SkinDx Bioc `.in` storefront (and reusable for `.com` later). Admin Google login is **out of scope** and must not be inferred from a Google email domain.

## Flow

1. User clicks the Google Identity Services button on login/register.
2. Google returns an **ID token** (`credential`) to the browser.
3. Frontend `POST /api/v1/auth/google` with `{ "credential": "<GOOGLE_ID_TOKEN>" }` over HTTPS (`withCredentials: true`).
4. Backend verifies the token with `google-auth-library` (`OAuth2Client.verifyIdToken`), checking signature, issuer, audience (`GOOGLE_CLIENT_ID`), expiry, `sub`, email, and `email_verified`.
5. Backend finds or creates a **CUSTOMER** account and `ExternalIdentity` (`provider=GOOGLE`, `providerUserId=sub`).
6. Backend issues application JWTs: **access token** in JSON, **refresh token** in an HttpOnly cookie.
7. Subsequent API calls use `Authorization: Bearer <accessToken>`; refresh uses the cookie.

Do **not** store the Google ID token as the app session. Do **not** trust client-supplied email, user id, role, or verification status.

## Account linking rules

| Situation | Result |
|---|---|
| Existing `ExternalIdentity` for Google `sub` | Sign in that user |
| No identity, email unused | Create `CUSTOMER` (`ACTIVE`, verified email), send welcome email once |
| Email already belongs to a password (or other) account | `409 Conflict` — no silent link |
| User `SUSPENDED` / `INACTIVE` | `403 Forbidden` |
| Linked user is not `CUSTOMER` | `403 Forbidden` |

Silent email-only linking is intentionally forbidden. A future authenticated linking flow can attach Google after password reauthentication.

## Session / cookies

| Item | Value |
|---|---|
| Access token | JSON body; short-lived; Axios Bearer header |
| Refresh token | HttpOnly cookie (`AUTH_REFRESH_COOKIE_NAME`, default `skindx_refresh_token`) |
| Cookie flags | `HttpOnly`; `Secure` in production (or when `SameSite=none`); `SameSite` from `AUTH_COOKIE_SAME_SITE` (default `lax`) |
| Logout | Revokes refresh token hash; clears cookie |

`.in` and `.com` are different origins from the API. Configure CORS (`CORS_ORIGINS`) and cookie `SameSite` deliberately for the deployed topology. For cross-site HTTPS storefront ↔ API, use `AUTH_COOKIE_SAME_SITE=none` and `AUTH_COOKIE_SECURE=true`.

## Environment variables

### Backend

```bash
GOOGLE_CLIENT_ID=....apps.googleusercontent.com
AUTH_REFRESH_COOKIE_NAME=skindx_refresh_token   # optional
AUTH_COOKIE_SAME_SITE=lax                       # lax | strict | none
AUTH_COOKIE_SECURE=false                        # omit to default from NODE_ENV
```

### Frontend (`.in`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=....apps.googleusercontent.com
```

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` must match `GOOGLE_CLIENT_ID`. Never put a Google client secret (or any private credential) in a `NEXT_PUBLIC_` variable. The GIS ID-token button flow used here does not require a client secret on the server.

## Google Cloud Console setup

1. Create or select a Google Cloud project.
2. Configure the **OAuth consent screen** (app name, support email, authorized domains when ready for production).
3. Create an **OAuth 2.0 Client ID** of type **Web application**.
4. **Authorized JavaScript origins** (examples — replace with real deployed hosts; do not invent production domains):
   - Local storefront: value of `SITE_IN_URL` origin (e.g. `http://localhost:3000`)
   - Production `.in` origin: from deployment config / `SITE_IN_URL`
   - Add `.com` origin later if Google login is enabled there
5. Redirect URIs are not required for the GIS ID-token (`credential`) button flow used by `@react-oauth/google` `GoogleLogin`. If you later switch to an authorization-code redirect flow, add exact callback URIs then.
6. Use separate OAuth clients or origin lists for development vs production.
7. Restrict production origins to the real storefront domains only.

Supply missing production hostnames via environment/`SITE_IN_URL` rather than hard-coding them in source.

## API

### `POST /api/v1/auth/google`

Request:

```json
{ "credential": "GOOGLE_ID_TOKEN" }
```

Success `200`: `{ accessToken, user }` plus `Set-Cookie` refresh token.  
Errors: `401` invalid/unverified Google credential, `403` inactive/non-customer, `409` email conflict, `422` validation.

### `GET /api/v1/auth/me`

Bearer access token. Returns `{ user, sites }`. Customers receive `sites: []`. Admins receive authorized sites.

### `POST /api/v1/auth/logout`

Revokes refresh token (body or cookie) and clears the cookie.

### `POST /api/v1/auth/refresh`

Accepts refresh token from JSON body (admin) or HttpOnly cookie (storefront). Rotates the refresh credential.

Customer email/password registration, OTP verification, and login reuse this same access/refresh cookie architecture. See [API_CONTRACT.md](./API_CONTRACT.md) for those endpoints.

## Local testing

1. Copy `backend/.env.example` → `.env` and set `GOOGLE_CLIENT_ID`.
2. Copy `frontend/.env.local.example` → `.env.local` and set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` to the same Web client ID.
3. Apply migrations: `cd backend && npx prisma migrate deploy` (or `prisma migrate dev` interactively).
4. Run API: `npm run dev` in `backend`.
5. Run storefront: `npm run dev` in `frontend`.
6. Open `/account/login` or `/account/register` and use **Sign in with Google** / **Sign up with Google**.

### Automated tests

```bash
# Backend (unit + integration; mocks Google; uses disposable test DB)
cd backend
npm test

# Frontend component / redirect tests
cd frontend
npm test
```

Google’s verification client is mocked in Jest. Do not call real Google APIs or use production credentials/customer data in CI.

## Deployment checklist

- [ ] Production Google OAuth Web client with production JS origins only
- [ ] Matching `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] `CORS_ORIGINS` includes storefront origins
- [ ] Cookie `SameSite` / `Secure` correct for API ↔ storefront topology
- [ ] Migrations applied (`external_identities`, nullable `password_hash`, email verification / outbox tables)
- [ ] Confirm welcome email sender/branding via Brevo env vars
- [ ] Manual end-to-end Google login against a non-production Google account
- [ ] Manual end-to-end password register → OTP verify → login against a non-production mailbox

## Admin security

Customer Google sessions always have `role: CUSTOMER`. Admin routes remain behind `authenticate` + `authorize('ADMIN', 'SUPER_ADMIN')`. A customer Google session must receive `403` on admin APIs (covered by integration tests).
