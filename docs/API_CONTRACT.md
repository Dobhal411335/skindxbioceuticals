# API Contract
## SkinDx Bioc platform

**Status:** Baseline conventions. Endpoint inventory is a planned starting point, not a claim that endpoints already exist.

## 1. Principles

- Base path: `/api/v1`.
- JSON request/response bodies unless a route explicitly documents another content type.
- Validate params, query strings, headers, and bodies at the API boundary using Zod.
- Use consistent status codes, pagination, and machine-readable error codes.
- Document each endpoint's authentication, permission, site scope, validation, side effects, and tests.
- Do not expose database records directly if doing so leaks internal fields or sensitive data.
- Never treat frontend validation as a security boundary.

## 2. Success and error format

Suggested success envelope:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` is optional and may contain pagination or other non-sensitive metadata.

Suggested error envelope:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated.",
    "details": []
  },
  "requestId": "correlation-id"
}
```

- `details` must not expose secrets, SQL, stack traces, or sensitive internal implementation data.
- Keep error codes stable so clients can handle them without parsing message text.
- In production, return safe messages and log diagnostic detail server-side with sensitive values redacted.

## 3. Status-code conventions

| Status | Use |
|---|---|
| `200` | Successful read/update or successful operation with a response body |
| `201` | Resource created |
| `202` | Accepted for asynchronous processing |
| `204` | Successful operation with no response body |
| `400` | Malformed request or invalid request shape |
| `401` | Authentication required or invalid |
| `403` | Authenticated but not permitted |
| `404` | Resource absent or deliberately concealed |
| `409` | State conflict, duplicate, or idempotency conflict |
| `422` | Valid request shape but business-rule validation failed, if adopted consistently |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |
| `502` / `503` | Provider/upstream unavailable or service temporarily unavailable |

Choose one consistent policy for using `400` versus `422`; document it and follow it.

## 4. Authentication and authorization contract

- Customer endpoints require customer authentication unless explicitly marked public.
- Admin endpoints require an authenticated admin and permission checks on the server.
- Every site-managed admin operation must enforce the user's permission for `IN`, `COM`, or both.
- Never accept a role, user ID, or site permission from the client as proof of authorization.
- Document cookie/session or bearer-token behavior, CSRF controls, expiry, refresh, and revocation once the session architecture is chosen.
- Google login callbacks and token exchange must be verified server-side.

### Customer Google auth (implemented)

- `POST /api/v1/auth/google` — body `{ "credential": "<Google ID token>" }`. Backend verifies with `google-auth-library`. Returns `{ accessToken, user }`. Sets HttpOnly refresh cookie (`AUTH_REFRESH_COOKIE_NAME`). Never returns password hashes or provider secrets. See [GOOGLE_AUTH.md](./GOOGLE_AUTH.md).
- `GET /api/v1/auth/me` — Bearer access token; customers get `sites: []`.
- `POST /api/v1/auth/logout` — revokes refresh token (body or cookie) and clears cookie.
- `POST /api/v1/auth/refresh` — refresh from JSON body (admin) or HttpOnly cookie (storefront). Cookie-driven refresh/logout require an allowed `Origin`/`Referer` matching `CORS_ORIGINS`.
- Customer Google sessions are always `CUSTOMER` and cannot call admin routes.

### Customer email/password auth (implemented)

Shared session architecture with Google: short-lived access JWT in JSON (`Authorization: Bearer`), refresh token in HttpOnly cookie for storefront clients. Never store refresh tokens in `localStorage`. Rate-limited.

- `POST /api/v1/auth/register` — body `{ name, email, password, confirmPassword }`. Creates `PENDING_VERIFICATION` customer, stores hashed email OTP, sends Brevo OTP for site `IN`. Returns `{ verificationRequired: true, email }`. **No session / tokens.** Conflicts with existing Active or Google-only accounts → `409`. Re-register on the same pending password email resends OTP.
- `POST /api/v1/auth/google` — body `{ credential }` (Google ID token). Verifies token server-side. If the email already belongs to a customer (including pending password signup), attaches Google for that verified email and activates the account; then links eligible guest orders. New emails create an `ACTIVE` Google customer.
- `POST /api/v1/auth/verify-email` — body `{ email, otp }`. Atomically consumes OTP, activates account, schedules welcome email once, returns `{ accessToken, user }` + refresh cookie.
- `POST /api/v1/auth/resend-verification` — body `{ email }`. Generic acknowledgement; enforces resend cooldown.
- `POST /api/v1/auth/login` — body `{ email, password }`. Verified customers get `{ accessToken, user }` + refresh cookie. Invalid credentials → generic `401`. Unverified → `403` with `errors.code = EMAIL_NOT_VERIFIED`. Suspended/inactive → `403`. Never grants admin. Rejects `VENDOR` (use vendor login).
- `POST /api/v1/auth/vendor/login` — body `{ username, password }`. Active `VENDOR` users with an approved+active `VendorApplication` get `{ accessToken, user }` + refresh cookie. Compares against bcrypt `passwordHash` only.
- `PATCH /api/v1/auth/password` — authenticated customer. Body `{ currentPassword?, newPassword, confirmPassword }`. When `hasPassword` is true, `currentPassword` is required and verified. Google-only accounts (no password hash) may set a password without `currentPassword`. On success: hash stored, all refresh tokens revoked, new `{ accessToken, user }` issued with rotated refresh cookie. Never returns password data.

Auth `user` DTO fields include: `id`, `email`, `role`, optional `username`, `firstName`, `lastName`, `imageUrl`, `hasPassword`, `linkedProviders` (`GOOGLE` from `ExternalIdentity` only — never inferred from `imageUrl`), `createdAt`.

### Vendor partner applications (implemented)

Public (rate-limited), site-scoped under `/sites/:siteCode/vendors`:

- `POST .../applications` — multi-step become-vendor payload; creates `PENDING` application.
- `POST .../applications/documents` — multipart image/PDF upload → `{ url, publicId }`.

Admin (Bearer admin + site access) under `/admin/sites/:siteCode/vendors`:

- `GET .../applications?status&q` — list/filter applications.
- `GET .../applications/:applicationId` — full detail + documents.
- `PATCH .../applications/:applicationId/status` — `{ status: PENDING|APPROVED|REJECTED }`. Approve creates `User` role `VENDOR`, stores **one** bcrypt `passwordHash` (login) plus `passwordPlain` (admin reveal only — not double-hashed), emails plaintext password. Response: `{ application, credentials: { username, password, email } | null, emailSent }`.
- `GET .../credentials?q&isActive` — approved vendors including `passwordPlain` for admin eye-toggle.
- `PATCH .../credentials/:applicationId/active` — `{ isActive }`.
- `POST .../credentials/:applicationId/regenerate-password` — new single hash + plain + email. Response: `{ credential, emailSent }`.

Vendor pricing: public product DTOs include `vendorPrice` when `Authorization` is a `VENDOR` JWT. Cart (`CUSTOMER`|`VENDOR`) and checkout recalculate sell price as `vendorPrice ?? price` for vendors.

### Customer / vendor account self-service (implemented)

All routes require `Authorization: Bearer` and `CUSTOMER` or `VENDOR` role. Ownership is always derived from `req.user.id`. Wishlist routes remain `CUSTOMER`-only.

- `PATCH /api/v1/me` — body `{ firstName, lastName? }`. Updates name only; never accepts role/status/email/password.
- `POST /api/v1/me/avatar` — multipart `file` image upload (Cloudinary `feature=profile`). Updates `User.imageUrl` for the authenticated account only. Missing file → `422`.
- `DELETE /api/v1/me/avatar` — clears `User.imageUrl` for the authenticated account.
- `GET /api/v1/me/addresses` — list current user's addresses.
- `POST /api/v1/me/addresses` — create address; `isDefault: true` clears other defaults in a transaction.
- `PATCH /api/v1/me/addresses/:addressId` — update owned address only (404 if not owned).
- `DELETE /api/v1/me/addresses/:addressId` — delete owned address only (404 if not owned).
- `GET /api/v1/orders?page&pageSize` — paginated orders for the authenticated customer or vendor only.
- `GET /api/v1/orders/:orderId` — order detail with items; 404 if not owned.
- `GET /api/v1/wishlist` — current wishlist (created if missing) with product summary fields (`available`, `quantity` sellable units, price, coupon, etc.). Response omits non-`ACTIVE` / non-`IN` leftovers.
- `POST /api/v1/wishlist` — body `{ productId, variantId? }`; active `IN` products only; conflict if duplicate.
- `POST /api/v1/wishlist/sync` — merge guest wishlist into the account. Body `{ items: [{ productId, variantId? }] }` (max 100). Optional `Idempotency-Key` header (union merge is naturally idempotent via unique `(wishlistId, productId)`). Returns `{ wishlist, skipped[] }` where skip reasons are `INVALID_PRODUCT` | `INACTIVE_OR_WRONG_SITE` | `INVALID_VARIANT`. Guests are not a server concept — unauthenticated callers receive `401`.
- `DELETE /api/v1/wishlist/items/:itemId` — remove owned wishlist item only.

Guest wishlist policy: `.in` storefront persists guest bags in browser `localStorage` only (product/variant IDs + optional display cache). No guest wishlist rows in PostgreSQL. After login / Google / email verify / session restore, the storefront posts `/wishlist/sync` then clears guest storage only on success.

OTP policy (env): length `OTP_LENGTH` (default 6), expiry `OTP_EXPIRES_IN_MINUTES` (default 10), max attempts `OTP_MAX_ATTEMPTS` (default 5), resend cooldown `OTP_RESEND_COOLDOWN_SECONDS` (default 60). OTPs are stored hashed only.

## 5. Site context

Use a canonical host-to-site mapping configured on the server, for example:
- production `.in` host → `IN`
- production `.com` host → `COM`
- local development hosts → explicitly configured local site mapping

Do not blindly trust an arbitrary `siteId` in a request. For admin operations, the requested site workspace must be checked against the authenticated admin's permissions.

For each endpoint, document whether it is:
- global/shared,
- site-scoped,
- customer-owned,
- admin-only,
- provider webhook.

## 6. Checkout, payments, and guest verification (implemented)

Base path: `/api/v1`. Money in API responses for payment create uses **paise** for Razorpay; order history money fields remain decimal strings (rupees).

### Guest checkout OTP

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/checkout/guest/session` | Public + rate limit | Body `{ email }`. Returns opaque `sessionToken` once. |
| `POST` | `/checkout/guest/send-otp` | Session token in body | Reuses auth OTP hashing + Brevo `sendOtpEmail`. |
| `POST` | `/checkout/guest/verify-otp` | Session token + OTP | Sets `emailVerifiedAt` on `GuestCheckoutSession`. |

### Payments (authenticated customer **or** verified guest)

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/payments/create-order` | Optional JWT **or** `guestSessionToken` | Requires `Idempotency-Key` header. Recalculates totals from DB variants; creates `Order` + Razorpay order. |
| `POST` | `/payments/verify` | Optional JWT **or** guest session owning order | Verifies Razorpay checkout signature server-side; idempotent capture. |
| `GET` | `/payments/status/:orderId` | Owner (JWT or guest session) | Reconciliation after modal dismiss/timeout. |
| `GET` | `/payments/confirmation` | JWT owner **or** `confirmationToken` | Thank You page data. |
| `POST` | `/webhooks/razorpay` | `X-Razorpay-Signature` on raw body | Idempotent via `WebhookEvent`; mounted before `express.json`. |

Create-order body (trusted fields only for identity/lines; prices ignored):

```json
{
  "items": [{ "variantId": "uuid", "quantity": 1 }],
  "shippingAddress": { "lastName": "…", "line1": "…", "city": "…", "postalCode": "…", "country": "IN" },
  "notes": "optional",
  "guestSessionToken": "required when not authenticated"
}
```

Idempotency: same key + same payload hash returns the existing Razorpay order; same key + different payload → `409`.

Guest order linking: on verified login / email verify / Google auth, `linkGuestOrdersByVerifiedEmail` attaches `userId` where `contactEmail` matches and `userId` is null.

## 6b. Planned endpoint groups (remaining)

These are initial route groups to consider; define exact paths and schemas as features are implemented.

| Group | Example purpose | Access |
|---|---|---|
| `/auth` | signup, login, logout, Google auth, verification, password reset | Public/rate-limited or authenticated depending on operation |
| `/me` | current customer profile and addresses | Customer |
| `/products` | catalog, product details, search, filtering | Public read; admin write |
| `/category` | catalog category data | Public read; admin write |
| `/cart` | retrieve/update current cart | Customer or supported guest-cart mechanism |
| `/wishlist` | current customer's wishlist | Customer |
| `/coupons` | validate coupon eligibility | Public/customer with rate limits; admin management |
| `/orders` | create/read/cancel where permitted | Customer; admin permissions for management |
| `/enquiries` | submit and manage enquiries | Public submission with abuse controls; admin read/manage |
| `/content` | public pages, banners, FAQs, blog content | Public read; admin write |
| `/media` | signed upload authorization and asset management | Authorized admin/editor |
| `/admin/sites` | list/manage authorized site workspaces | Admin permission |
| `/admin/sites/:siteCode/dashboard` | site-scoped dashboard metrics | Admin + site access |
| `/admin/sites/:siteCode/orders/online-log` | paginated online (non-COD) order log | Admin + site access |
| `/admin/sites/:siteCode/orders/cancelled` | paginated cancelled order log | Admin + site access |
| `/admin/sites/:siteCode/company-basic-info` | get/upsert site-scoped company profile | Admin + site access |
| `/admin/sites/:siteCode/navbar-sections` | list/create site-scoped navbar sections | Admin + site access |
| `/admin/sites/:siteCode/social-posts` | CRUD site-scoped Instagram/Facebook posts | Admin + site access |
| `/admin/sites/:siteCode/gallery` | CRUD site-scoped gallery images/videos | Admin + site access |
| `/admin/sites/:siteCode/customer-reviews` | CRUD site-scoped curated customer testimonials | Admin + site access |
| `/admin/sites/:siteCode/doctors` | CRUD site-scoped doctor profiles | Admin + site access |
| `/admin/sites/:siteCode/doctor-page` | get/upsert doctors landing about + services config | Admin + site access |
| `/admin/sites/:siteCode/footer` | get/upsert site-scoped footer config | Admin + site access |
| `/admin/sites/:siteCode/top-advertisement` | get/upsert site-scoped top advertisement (3 sections) | Admin + site access |
| `/admin/sites/:siteCode/popup-banner` | get/upsert site-scoped landing popup banner | Admin + site access |
| `/admin/sites/:siteCode/about-us-banner` | get/upsert site-scoped About Us home banner (3 sections) | Admin + site access |
| `/admin/sites/:siteCode/promo-banners` | get/upsert site-scoped home promo banner row tiles | Admin + site access |
| `/admin/sites/:siteCode/collection-banners` | get/upsert site-scoped post-gallery collection companion banner | Admin + site access |
| `/admin/sites/:siteCode/faq` | get/upsert site-scoped FAQ sections and questions | Admin + site access |
| `/admin/sites/:siteCode/insights` | get/upsert site-scoped landing insight cards and Q&A | Admin + site access |
| `/admin/sites/:siteCode/hero-banners` | get/upsert site-scoped home hero carousel slides | Admin + site access |
| `/admin/sites/:siteCode/category` | CRUD site-scoped categories and nested subcategories | Admin + site access |
| `/admin/sites/:siteCode/subcategories/:subcategoryId/products` | CRUD phase-1 products under a subcategory | Admin + site access |
| `/admin/sites/:siteCode/coupons` | CRUD site-scoped discount coupon codes (amount or percent) | Admin + site access |
| `/admin/users` | staff accounts and roles | Highly restricted admin |
| `/admin/audit-logs` | review administrative changes | Authorized admin |

### Admin company basic info (implemented)

- `GET /api/v1/admin/sites/:siteCode/company-basic-info` — Bearer admin JWT; `requireSiteAccess`. Returns the site record or empty defaults (`id: null`).
- `PUT /api/v1/admin/sites/:siteCode/company-basic-info` — upsert one row per site. Body includes company name/domain (required), contact numbers (10 digits when present), WhatsApp, emails, addresses, map/social/SEO fields, and logo refs `{ url, publicId }`. `siteId` is taken from the authenticated site context only.

### Public company basic info (storefront)

- `GET /api/v1/sites/:siteCode/company-basic-info` — public read for an active site (no auth). Used by the `.in` storefront for SEO/Open Graph metadata, navbar/footer logos, contact details, and social links.

### Admin navbar sections (implemented)

- `GET /api/v1/admin/sites/:siteCode/navbar-sections` — Bearer admin JWT; `requireSiteAccess`. Lists all sections (including inactive) with nested sub-sections, ordered by `order`.
- `POST /api/v1/admin/sites/:siteCode/navbar-sections` — create a section. Body: `title` (required), `url` (path/hash/absolute, default `#`), `active`, optional `order`, `subSections[]` (`title`, `url`, `active`, `order`). `siteId` from authenticated site context only.
- `PUT /api/v1/admin/sites/:siteCode/navbar-sections/:sectionId` — replace section + sub-sections for that site (404 if missing or other site).
- `PATCH /api/v1/admin/sites/:siteCode/navbar-sections/:sectionId` — body `{ active: boolean }` toggles visibility.
- `DELETE /api/v1/admin/sites/:siteCode/navbar-sections/:sectionId` — deletes the section and cascaded sub-sections.

### Public navbar sections (storefront)

- `GET /api/v1/sites/:siteCode/navbar-sections` — public read for an active site (no auth). Returns only active sections and active sub-sections, ordered by `order`. Used by the `.in` storefront header and mobile nav.

### Admin social posts (implemented)

Unified Instagram + Facebook posts (`postType`: `instagram` | `facebook`) per site.

- `GET /api/v1/admin/sites/:siteCode/social-posts` — Bearer admin JWT; `requireSiteAccess`. Optional query `postType`. Returns all posts for the site (including inactive), ordered by `order` asc then `createdAt` desc.
- `POST /api/v1/admin/sites/:siteCode/social-posts` — create. Body: `postType`, `imageUrl`, `imagePublicId`, `postUrl`, optional `active`/`order`. `siteId` from authenticated site context only.
- `PUT /api/v1/admin/sites/:siteCode/social-posts/:postId` — full update within the site.
- `PATCH /api/v1/admin/sites/:siteCode/social-posts/:postId` — partial update of `active` and/or `order`.
- `DELETE /api/v1/admin/sites/:siteCode/social-posts/:postId` — delete within the site.

### Public social posts (storefront)

- `GET /api/v1/sites/:siteCode/social-posts` — public read for an active site (no auth). Returns active posts only, ordered for carousel display on the `.in` storefront home page.

### Admin gallery (implemented)

Site-scoped lookbook items (`mediaType`: `image` | `video` | `text_card`) for IN and COM.

Shared body fields: `mediaType`, optional `active` (default true).

- **IMAGE / VIDEO**: require `mediaUrl` (prefer HTTPS) + `mediaPublicId`; optional `clickUrl` (path, hash, or absolute http(s) — storefront wraps media). Text fields (`heading`, `description`, `buttonLabel`, `buttonUrl`) are cleared server-side.
- **TEXT_CARD**: require `heading`, `description`, `buttonLabel`, `buttonUrl` (path/hash/http(s)). Media fields are cleared server-side; no Cloudinary asset.

- `GET /api/v1/admin/sites/:siteCode/gallery` — Bearer admin JWT; `requireSiteAccess`. Optional query `mediaType`. Returns all items for the site (including inactive), newest first by `createdAt`.
- `POST /api/v1/admin/sites/:siteCode/gallery` — create within authenticated site context.
- `PUT /api/v1/admin/sites/:siteCode/gallery/:itemId` — full update within the site.
- `PATCH /api/v1/admin/sites/:siteCode/gallery/:itemId` — partial update of `active` only.
- `DELETE /api/v1/admin/sites/:siteCode/gallery/:itemId` — delete within the site (Cloudinary cleanup for media types only).

Uploads use existing media APIs with `feature=gallery`: `POST /api/v1/media/images` and `POST /api/v1/media/videos`.

### Public gallery (storefront)

- `GET /api/v1/sites/:siteCode/gallery` — public read for an active site (no auth). Returns active items only (media + text-card fields + `active`), newest first, for the `.in` storefront lookbook masonry (≈3 desktop columns, ≤2 items per column).

### Admin customer reviews (implemented)

Site-scoped curated testimonials for the storefront (not product-review moderation). Fields: `customerName`, `designation`, `description`, `rating` (1–5), `imageUrl`, `imagePublicId`, optional `active`/`order`.

- `GET /api/v1/admin/sites/:siteCode/customer-reviews` — Bearer admin JWT; `requireSiteAccess`. Returns all reviews for the site (including inactive), ordered by `order` asc then `createdAt` desc.
- `POST /api/v1/admin/sites/:siteCode/customer-reviews` — create. `siteId` from authenticated site context only. Prefer HTTPS image URLs.
- `PUT /api/v1/admin/sites/:siteCode/customer-reviews/:reviewId` — full update within the site.
- `PATCH /api/v1/admin/sites/:siteCode/customer-reviews/:reviewId` — partial update of `active` and/or `order`.
- `DELETE /api/v1/admin/sites/:siteCode/customer-reviews/:reviewId` — delete within the site.

Uploads use existing media APIs with `feature=reviews`: `POST /api/v1/media/images`.

### Public customer reviews (storefront)

- `GET /api/v1/sites/:siteCode/customer-reviews` — public read for an active site (no auth). Returns active reviews only, ordered for the `.in` storefront testimonials carousel.

### Admin doctor profiles (implemented)

Site-scoped clinician cards for the `/doctors` storefront page. Fields: `name` (normalized to `Dr. …`), `specialization`, `about`, `experienceYears`, `state` (Indian state/UT), `city`, `photoUrl`, `photoPublicId`, optional `active`/`order`.

- `GET /api/v1/admin/sites/:siteCode/doctors` — Bearer admin JWT; `requireSiteAccess`. Returns all profiles for the site (including inactive), ordered by `order` asc then `createdAt` desc.
- `POST /api/v1/admin/sites/:siteCode/doctors` — create. `siteId` from authenticated site context only. Prefer HTTPS photo URLs.
- `PUT /api/v1/admin/sites/:siteCode/doctors/:doctorId` — full update within the site.
- `PATCH /api/v1/admin/sites/:siteCode/doctors/:doctorId` — partial update of `active` and/or `order`.
- `DELETE /api/v1/admin/sites/:siteCode/doctors/:doctorId` — delete within the site.

Uploads use existing media APIs with `feature=doctors`: `POST /api/v1/media/images`.

### Public doctor profiles (storefront)

- `GET /api/v1/sites/:siteCode/doctors` — public read for an active site (no auth). Returns active profiles only (includes `state` + `city`), ordered for the `.in` storefront `/doctors` cards grid.

### Admin order logs (implemented)

Site-scoped paginated order logs for admin. Dashboard revenue (`GET /admin/sites/:siteCode/dashboard`) sums `grandTotal` only for orders that are not `CANCELLED`/`REFUNDED` and have at least one payment with status `CAPTURED` (completed payment). Recent orders return the latest 10 by `createdAt`.

- `GET /api/v1/admin/sites/:siteCode/orders/online-log` — Bearer admin JWT; `requireSiteAccess`. Lists non-COD payment orders. Query: `page` (default 1), `pageSize` (default 10, max 50), optional `date` (`YYYY-MM-DD`, defaults to today when `all` is false), optional `all=true` to ignore the day filter, optional `q` (max 120; matches order number, contact email, or user email). Ordered by `createdAt` desc. Response includes `orders`, `hasMore`, `total`, `filter.mode` (`day`|`all`).
- `GET /api/v1/admin/sites/:siteCode/orders/cancelled` — Bearer admin JWT; `requireSiteAccess`. Same query/pagination as online-log. Cancel Order workspace: orders that have at least one payment with `status=PENDING` and are not already `CANCELLED`/`REFUNDED` (candidates for cancel review until a dedicated cancel action exists).

### Admin doctor appointments (implemented)

Site-scoped appointment requests submitted from storefront doctor cards. Fields: `doctorId`, `patientName`, `email`, `scheduledAt`, `problem`, `status` (`NEW` | `CONTACTED` | `CLOSED` | `CANCELLED`). List responses include `doctorName` and `doctorSpecialization`.

- `GET /api/v1/admin/sites/:siteCode/doctor-appointments` — Bearer admin JWT; `requireSiteAccess`. Optional query: `doctorId`, `from`, `to` (ISO datetimes for `scheduledAt` range). Ordered by `scheduledAt` desc then `createdAt` desc.
- `GET /api/v1/admin/sites/:siteCode/doctor-appointments/:appointmentId` — Bearer admin JWT; `requireSiteAccess`. Single request within the site.
- `PATCH /api/v1/admin/sites/:siteCode/doctor-appointments/:appointmentId` — Bearer admin JWT; `requireSiteAccess`. Body: `{ status }` with one of `NEW` | `CONTACTED` | `CLOSED` | `CANCELLED`. Site-scoped; cannot patch across sites.

### Public doctor appointments (storefront)

- `POST /api/v1/sites/:siteCode/doctor-appointments` — public create for an active site (no auth). Body: `doctorId` (active doctor on that site), `patientName`, `email`, `scheduledAt` (future ISO datetime), `problem`. Optional honeypot field `website` (empty for humans). Rate-limited. `siteId` resolved from `siteCode` only.

### Admin doctor page (implemented)

One upsertable doctors landing-page config per site (`DoctorPageConfig`) with about section + nested service items.

- `GET /api/v1/admin/sites/:siteCode/doctor-page` — Bearer admin JWT; `requireSiteAccess`. Returns the site record or empty defaults (`id: null`) including inactive services.
- `PUT /api/v1/admin/sites/:siteCode/doctor-page` — upsert one row per site and replace nested services. Body: `aboutHeading`, `aboutDescription`, `aboutHighlights[]` (strings), `aboutButtonLabel`, `aboutButtonUrl`, `aboutImageUrl`/`aboutImagePublicId`, optional `aboutSecondaryImageUrl`/`aboutSecondaryImagePublicId`, optional `experienceYears`, `servicesHeading`, `servicesSubheading`, `services[]` (`iconKey` from allowed Lucide set, `name`, `description`, `readMoreUrl`, `active`, optional `order`). `siteId` from authenticated site context only. Replaced Cloudinary `publicId`s are deleted best-effort.

Uploads use existing media APIs with `feature=doctors`: `POST /api/v1/media/images`.

### Public doctor page (storefront)

- `GET /api/v1/sites/:siteCode/doctor-page` — public read for an active site (no auth). Returns active services only. Used by the `.in` storefront `/doctors` about + services sections.

### Admin footer (implemented)

One upsertable footer config per site (columns + brand copy). Logo and social links come from company basic info, not this resource.

- `GET /api/v1/admin/sites/:siteCode/footer` — Bearer admin JWT; `requireSiteAccess`. Returns the site record or empty defaults (`id: null`) including inactive nested items.
- `PUT /api/v1/admin/sites/:siteCode/footer` — upsert one row per site and replace nested columns/links. Body: `thankYou`, `description`, `columns[]` (`title`, `active`, `order`, `links[]` with `label`/`url`/`active`/`order`). `siteId` from authenticated site context only.

### Public footer (storefront)

- `GET /api/v1/sites/:siteCode/footer` — public read for an active site (no auth). Returns active columns and links only. Used by the `.in` storefront footer for columns/copy (falls back to static landing data when empty/unavailable). Storefront logo and socials use company basic info.

### Admin top advertisement (implemented)

One upsertable config per site with three section lists: announcement bar, header utility strip, and feature benefits bar.

- `GET /api/v1/admin/sites/:siteCode/top-advertisement` — Bearer admin JWT; `requireSiteAccess`. Returns the site record or empty defaults (`id: null`) including inactive items.
- `PUT /api/v1/admin/sites/:siteCode/top-advertisement` — upsert one row per site and replace all items. Body: `announcements[]` (`text`, optional `url`, `active`), `utilityItems[]` (same shape), `benefits[]` (same shape: `text`, optional `url`, `active`). `siteId` from authenticated site context only.

### Public top advertisement (storefront)

- `GET /api/v1/sites/:siteCode/top-advertisement` — public read for an active site (no auth). Returns active items only, grouped as `announcements`, `utilityItems`, and `benefits`. Used by the `.in` storefront announcement bar, header utility strip, and feature benefits bar (falls back to static landing data when empty/unavailable).

### Admin PopUp banner (implemented)

One upsertable landing popup banner config per site (`PopupBannerConfig`).

- `GET /api/v1/admin/sites/:siteCode/popup-banner` — Bearer admin JWT; `requireSiteAccess`. Returns the site record or empty defaults (`id: null`, `active: false`).
- `PUT /api/v1/admin/sites/:siteCode/popup-banner` — upsert one row per site. Body: `imageUrl`, `imagePublicId`, `miniHeading`, `heading`, `subDescription`, `buttonLabel`, `buttonUrl`, `active`. When `active` is true, image, heading, button label, and button URL are required. `siteId` from authenticated site context only. Replaced Cloudinary `publicId`s are deleted best-effort.

Uploads use existing media APIs with `feature=popup`: `POST /api/v1/media/images`.

### Public PopUp banner (storefront)

- `GET /api/v1/sites/:siteCode/popup-banner` — public read for an active site (no auth). Returns the config only when `active` is true; otherwise empty defaults (`id: null`, `active: false`). Used by the `.in` storefront `PromoPopupBanner`. Storefront dismiss uses **sessionStorage** key `skindx.popupBanner.dismissed.{siteCode}` (session-scoped, not localStorage). Empty/error/inactive responses hide the popup.

### Admin About Us banner (implemented)

One upsertable home-page About Us banner config per site with three sections: promotional header, about cards carousel, and a dual bottom block (highlight cards + text slides).

- `GET /api/v1/admin/sites/:siteCode/about-us-banner` — Bearer admin JWT; `requireSiteAccess`. Returns the site record or empty defaults (`id: null`) including inactive nested items.
- `PUT /api/v1/admin/sites/:siteCode/about-us-banner` — upsert one row per site and replace nested items. Body: `promoLabel`, `promoHeading`, `promoSubheading`, `promoButtonLabel`, `promoButtonUrl`, `aboutCards[]` (`imageUrl`, `imagePublicId`, `label`, `heading`, `description`, `buttonLabel`, `buttonUrl`, `active`, optional `sortOrder`), `highlightItems[]` (`imageUrl`, `imagePublicId`, `heading`, `buttonLabel`, `buttonUrl`, `active`, optional `sortOrder`), `textSlides[]` (`heading`, `subheading`, `active`, optional `sortOrder`). `siteId` from authenticated site context only. After save, Cloudinary assets whose `publicId`s are no longer referenced on cards/highlights are deleted best-effort.

Uploads use existing media APIs with `feature=about`: `POST /api/v1/media/images`.

### Public About Us banner (storefront)

- `GET /api/v1/sites/:siteCode/about-us-banner` — public read for an active site (no auth). Returns active nested items only. Used by the `.in` storefront `SpecialsHeader`, `AboutSplit`, and `BlogCarousel` home blocks (falls back to static landing data when empty/unavailable). Prefer HTTPS Cloudinary image URLs.

### Admin FAQ (implemented)

Site-scoped FAQ groups (`sections[]`) each with nested Q&A items. Fields per section: `title`, `active`, `order`. Fields per item: `question`, `answer`, `showOnLanding`, `active`, `order`.

- `GET /api/v1/admin/sites/:siteCode/faq` — Bearer admin JWT; `requireSiteAccess`. Returns all sections/items for the site (including inactive), ordered by `order`. Empty defaults are `{ sections: [] }`.
- `PUT /api/v1/admin/sites/:siteCode/faq` — replace all sections and items for the site. Body: `sections[]` (`title`, `active`, `order`, `items[]` with `question`, `answer`, `showOnLanding`, `active`, `order`). `siteId` from authenticated site context only.

### Public FAQ (storefront)

- `GET /api/v1/sites/:siteCode/faq` — public read for an active site (no auth). Returns active sections and active items only.
- `GET /api/v1/sites/:siteCode/faq?landing=true` — same, but only items with `showOnLanding: true` (empty sections omitted). Used by the `.in` storefront home FAQ snippet; the full FAQ page uses the unfiltered public read (falls back to static data when empty/unavailable).

### Admin Insights (implemented)

Site-scoped landing Insights strip (distinct from full Blog CMS and Website FAQ). Payload: `cards[]` and `qaItems[]`. Card fields: `category`, `name`, `publishedAt`, `imageUrl`, `imagePublicId`, TipTap HTML `description`, `active`, `order`. Q&A fields: `question`, `answer` (TipTap HTML), `active`, `order`.

- `GET /api/v1/admin/sites/:siteCode/insights` — Bearer admin JWT; `requireSiteAccess`. Returns all cards/Q&A for the site (including inactive), ordered by `order`. Empty defaults are `{ cards: [], qaItems: [] }`.
- `PUT /api/v1/admin/sites/:siteCode/insights` — replace all insight cards and Q&A for the site. Body: `cards[]`, `qaItems[]`. `siteId` from authenticated site context only.

Uploads use existing media APIs with `feature=insights`: `POST /api/v1/media/images`.

### Public Insights (storefront)

- `GET /api/v1/sites/:siteCode/insights` — public read for an active site (no auth). Returns active cards and active Q&A only. Used by the `.in` storefront home Insights / Q&A section (falls back to static data when empty/unavailable).

### Admin blogs (implemented)

Site-scoped blog posts. Create with `name`, `category`, optional `slug` (auto-generated from name when omitted). Edit fills `title`, `publishedAt`, `createdBy`, cover image, TipTap HTML `description`, `blockquote`, and `active`.

- `GET /api/v1/admin/sites/:siteCode/blogs` — Bearer admin JWT; `requireSiteAccess`. Optional `?category=`. Lists all blogs for the site (including inactive), newest `publishedAt` first.
- `POST /api/v1/admin/sites/:siteCode/blogs` — create. Body: `name`, `category`, optional `slug`, optional `badgeText`, `stat1Number`, `stat1Name`, `stat1Text`, `stat2Number`, `stat2Name`, `stat2Text`, and optional `active` (default true). Title defaults to name; content/image fields start empty. Slug unique per site (`409` on conflict when explicit).
- `GET /api/v1/admin/sites/:siteCode/blogs/:blogId` — one blog for edit.
- `PUT /api/v1/admin/sites/:siteCode/blogs/:blogId` — full update. Body: `name`, `slug`, `category`, optional landing-card fields `badgeText`, `stat1Number`, `stat1Name`, `stat1Text`, `stat2Number`, `stat2Name`, `stat2Text`, plus `title`, `publishedAt`, `createdBy`, `imageUrl`, `imagePublicId`, `description`, `blockquote`, `active`. Prefer HTTPS image URLs. Replacing `imagePublicId` deletes the previous Cloudinary asset best-effort.
- `PATCH /api/v1/admin/sites/:siteCode/blogs/:blogId` — `{ name? }` and/or `{ active? }` (at least one required). Used for inline name edits on the admin list.
- `DELETE /api/v1/admin/sites/:siteCode/blogs/:blogId` — deletes the row and its cover Cloudinary asset when present.

Uploads use existing media APIs with `feature=blog`: `POST /api/v1/media/images`.

### Public blogs (storefront)

- `GET /api/v1/sites/:siteCode/blogs` — public read for an active site (no auth). Returns `{ blogs, categories }` with active blogs only. Optional `?category=`, `?limit=`, `?recent=true` (caps at 4). Used by `.in` `/blog`, landing `BlogGrid`, and sidebar recent articles (falls back to static data when the API is unavailable). Prefer HTTPS Cloudinary image URLs.
- `GET /api/v1/sites/:siteCode/blogs/:slug` — public detail by site-scoped slug. Returns the active blog plus `related[]` cards (same category, excluding current, max 4: `name`, `imageUrl`, `publishedAt`, `createdBy`). Inactive/missing → `404`.

### Admin webpages (implemented)

Site-scoped CMS pages with template types `design1`–`design7` and `design9` (**not** `design8` / amenities). Create with `title`, optional `slug`, `active`, `templateType`. Edit fills SEO, hero/media Json assets (`{url,key}`), and design-specific content (highlights, paragraphs, grid/team cards, etc.). Reserved storefront slugs (`about`, `blog`, `products`, …) are rejected.

- `GET /api/v1/admin/sites/:siteCode/webpages` — Bearer admin JWT; `requireSiteAccess`. Lists all webpages for the site (including inactive), newest `createdAt` first.
- `POST /api/v1/admin/sites/:siteCode/webpages` — create. Body: `title`, optional `slug`, optional `active` (default true), optional `templateType` (default `design1`). Slug unique per site (`409` on conflict when explicit).
- `GET /api/v1/admin/sites/:siteCode/webpages/:webpageId` — full webpage for edit.
- `PUT /api/v1/admin/sites/:siteCode/webpages/:webpageId` — content update (partial whitelist of CMS fields). Prefer HTTPS image URLs; nested image objects use `{ url, key }`.
- `PATCH /api/v1/admin/sites/:siteCode/webpages/:webpageId` — list meta: `title?`, `slug?`, `active?`, `templateType?` (at least one required).
- `DELETE /api/v1/admin/sites/:siteCode/webpages/:webpageId` — deletes the row and best-effort Cloudinary keys collected from Json media fields.

Uploads use existing media APIs with `feature=webpage`: `POST /api/v1/media/images`.

### Public webpages (storefront)

- `GET /api/v1/sites/:siteCode/webpages` — public list of active webpages for an active site (no auth).
- `GET /api/v1/sites/:siteCode/webpages/by-slug/:slug` — public detail by site-scoped slug (active only). Used by `.in` `/(storefront)/[slug]`. Inactive/missing → `404`.

### Admin promo banners (implemented)

Site-scoped home promo banner row (image tiles with optional click URLs).

- `GET /api/v1/admin/sites/:siteCode/promo-banners` — Bearer admin JWT; `requireSiteAccess`. Returns config + all items (including inactive) ordered by `sortOrder`. Empty defaults are `{ id: null, items: [] }`.
- `PUT /api/v1/admin/sites/:siteCode/promo-banners` — replace all items for the site. Body: `items[]` with `imageUrl`, `imagePublicId`, `miniHeading`, `heading`, `buttonLabel`, `buttonUrl` (path/hash/absolute), `sortOrder?`, `active`. `siteId` from authenticated site context only. Orphaned Cloudinary `publicId`s are deleted best-effort after save.

Uploads use existing media APIs with `feature=promo`: `POST /api/v1/media/images`.

### Public promo banners (storefront)

- `GET /api/v1/sites/:siteCode/promo-banners` — public read for an active site (no auth). Returns active items only. Used by the `.in` storefront promo banner row (3-up carousel; controls when length > 3). Falls back to static landing promos when empty/unavailable.

### Admin collection banners (implemented)

Site-scoped post-gallery collection companion banner: section header + titled image slides.

- `GET /api/v1/admin/sites/:siteCode/collection-banners` — Bearer admin JWT; `requireSiteAccess`. Returns `sectionLabel`, `sectionHeading`, and all items (including inactive) ordered by `sortOrder`.
- `PUT /api/v1/admin/sites/:siteCode/collection-banners` — replace section fields + items. Body: `sectionLabel`, `sectionHeading`, `items[]` with `imageUrl`, `imagePublicId`, `title` (required), `description`, `buttonUrl`, optional hover CTA fields `button1Label`, `button1Url`, `button2Label`, `button2Url`, `sortOrder?`, `active`. Orphaned Cloudinary assets deleted best-effort after save.

Uploads use existing media APIs with `feature=collection`: `POST /api/v1/media/images`.

### Public collection banners (storefront)

- `GET /api/v1/sites/:siteCode/collection-banners` — public read for an active site (no auth). Returns active items only. Used by the `.in` storefront collection section after the gallery (left image carousel synced with right title list + highlight). Empty items → section hidden.

### Admin hero banners (implemented)

Site-scoped home hero carousel slides. Each slide has `layoutType` (`FULL_WIDTH` | `SPLIT_DUAL` | `MULTI_IMAGE`), `order`, and `active`.

Layout-specific fields:
- `FULL_WIDTH` — required `mobileImageUrl` + `desktopImageUrl`; optional `buttonUrl` is the image click destination (copy/CTA label fields are cleared/ignored).
- `SPLIT_DUAL` — copy + dual CTAs + required `leftImageUrl` / `rightImageUrl` (no mobile/desktop banner images; storefront mobile uses the left image with overlay copy).
- `MULTI_IMAGE` — copy + CTA + nested `gridImages[]` (4–6 required); no mobile/desktop banner images.

- `GET /api/v1/admin/sites/:siteCode/hero-banners` — Bearer admin JWT; `requireSiteAccess`. Returns all slides (including inactive) ordered by `order`. Empty defaults are `{ slides: [] }`.
- `PUT /api/v1/admin/sites/:siteCode/hero-banners` — replace all slides for the site. Body: `slides[]` with layout-specific required fields. `siteId` from authenticated site context only. After save, Cloudinary assets whose `publicId`s are no longer referenced are deleted best-effort.

Uploads use existing media APIs with `feature=hero`: `POST /api/v1/media/images`.

### Public hero banners (storefront)

- `GET /api/v1/sites/:siteCode/hero-banners` — public read for an active site (no auth). Returns active slides only, ordered by `order`. Used by the `.in` storefront home hero carousel (falls back to static landing data when empty/unavailable). Prefer HTTPS Cloudinary image URLs.

### Admin categories & catalog products (phase 1, implemented)

Site-scoped categories use the hierarchical `Category` model (`parentId` null = main category; set = subcategory). Products are minimal phase-1 records linked via `Product.subcategoryId` (and `ProductCategory` join).

**Categories**
- `GET /api/v1/admin/sites/:siteCode/category` — Bearer admin JWT; `requireSiteAccess`. Lists root categories (including inactive).
- `POST /api/v1/admin/sites/:siteCode/category` — create root category. Body: `name`, optional `active`/`order`/`description`. No banner on roots. `siteId` from authenticated site context only. Slug is server-generated and unique per site.
- `PUT /api/v1/admin/sites/:siteCode/category/:categoryId` — full update of a root category (name/active/order/description).
- `PATCH /api/v1/admin/sites/:siteCode/category/:categoryId` — `{ active }` and/or `{ order }`.
- `DELETE /api/v1/admin/sites/:siteCode/category/:categoryId` — delete root category (blocked if subcategories remain).

**Subcategories**
- `GET /api/v1/admin/sites/:siteCode/category/:categoryId/subcategories`
- `POST /api/v1/admin/sites/:siteCode/category/:categoryId/subcategories` — body `{ name, bannerUrl, bannerPublicId, active?, order? }`. Prefer HTTPS banner URLs.
- `PUT|PATCH|DELETE /api/v1/admin/sites/:siteCode/category/:categoryId/subcategories/:subcategoryId` — delete blocked if products remain; deletes Cloudinary banner when present.
- `GET /api/v1/admin/sites/:siteCode/subcategories/:subcategoryId` — fetch one subcategory by id (for admin product pages).

**Products (under subcategory — `productType = CATEGORY`)**
- `GET /api/v1/admin/sites/:siteCode/subcategories/:subcategoryId/products`
- `POST /api/v1/admin/sites/:siteCode/subcategories/:subcategoryId/products` — body `{ productCode, name, active?, isFeatured?, isRecent?, isBestSeller? }`. Sets `productType = CATEGORY` and requires the subcategory. `productCode` unique per site; slug server-generated; `active` maps to `ProductStatus` ACTIVE/DRAFT.
- `PUT|PATCH|DELETE .../products/:productId` — PATCH supports `active` / `name` / `productCode` / landing flags. Only CATEGORY products under that subcategory.

**Direct products (`productType = DIRECT`, no subcategory)**  
Admin UI: `/admin/{siteCode}/products/add-direct` (module `add-direct-product`).
- `GET /api/v1/admin/sites/:siteCode/products/direct` — lists DIRECT products for the site (oldest first).
- `POST /api/v1/admin/sites/:siteCode/products/direct` — body same as subcategory create (`productCode`, `name`, `active?`, landing flags). Sets `productType = DIRECT`, `subcategoryId = null`; does not write `ProductCategory`.
- `PUT|PATCH|DELETE /api/v1/admin/sites/:siteCode/products/direct/:productId` — only products with `productType = DIRECT` for the site; `404` otherwise. PATCH supports `active` / `name` / `productCode` / landing flags.
- Mounted before the general `/products` admin router so `direct` is not treated as a product id.

Catalog product DTO includes `productType` (`DIRECT` | `CATEGORY`) and nullable `subcategoryId`.

**Admin View All Products (site-scoped list / delete)**  
- `GET /api/v1/admin/sites/:siteCode/products` — Bearer admin JWT + `requireSiteAccess`. Lists products for the site (newest first). Response `data` is an array of list rows; pagination in top-level `meta` (`page`, `limit`, `total`, `totalPages`).
  - Query: `period` (`today` default | `all` | `day`), `date` (`YYYY-MM-DD`, required when `period=day`), `status` (`all` default | `active` | `draft`), `q` (max 120), `page` (default 1), optional `offset` (preferred for infinite scroll; overrides `(page-1)*limit`), `limit` (default `10`, max `48`).
  - Each row: `id`, `productCode`, `name`, `slug`, `active`, flags, `subcategoryId` / `subcategoryName`, `imageUrl`, `price`, `vendorPrice`, `quantity`, `currency`, `createdAt`, `updatedAt`.
- `DELETE /api/v1/admin/sites/:siteCode/products/:productId` — hard-deletes the product for the site; `404` if missing/other site; `409` when any variant appears on an order line. Cart/wishlist rows cascade.

**Product edit details (section PUT pattern)**  
Prefer focused section replaces over one giant nested PUT so saving sizes cannot wipe gallery/tax. All require Bearer admin JWT + `requireSiteAccess`. Responses return the full edit payload after mutation. View All Products detail modal reuses this payload.

- `GET /api/v1/admin/sites/:siteCode/products/:productId/edit` — load core product + all section data (sizes, colors, variants/offers, gallery, videos, description, info sections, editorial reviews, tags, highlights, tax, coupon) plus site color/tag masters and active coupon options.
- `POST /api/v1/admin/sites/:siteCode/products/catalog-colors` — body `{ name, hex }` (`#RRGGBB`); site-scoped master color.
- `PUT .../products/:productId/sections/sizes` — `{ sizeChartUrl?, sizeChartPublicId?, sizes[{ label, active, sortOrder? }] }` (sizes optional; empty array clears).
- `PUT .../sections/colors` — `{ colors[{ colorId?, name, hex?, active, sortOrder? }] }` (replace-all; colors optional; empty array clears).
- `PUT .../sections/variants` — `{ variants[{ id?, sizeLabel?, colorLabel?, price, vendorPrice?, quantity, weightGrams?, isActive?, profileImage?, subImages[] }] }` maps to `ProductVariant` + inventory. `price` is required; `sizeLabel` / `colorLabel` are optional (null/omit for a single base-price offer when the product has no sizes/colors).
- `PUT .../sections/coupon` — `{ couponId: uuid | null }`.
- `PUT|DELETE .../sections/tax` — PUT `{ cgst, sgst }`; DELETE clears tax.
- `PUT .../sections/gallery` — `{ images[{ imageUrl, imagePublicId, isPrimary, sortOrder? }] }`.
- `PUT .../sections/videos` — `{ videos[{ name, url, description?, sortOrder? }] }`.
- `PUT .../sections/description` — `{ description }`.
- `PUT .../sections/info` — `{ sections[{ title, body, sortOrder? }] }`.
- `POST|PUT|DELETE .../sections/reviews[/:reviewId]` — admin editorial reviews (`createdByName`, `rating` 1–5, `title`, `body`, optional image).
- `PUT .../sections/tags` — `{ tagNames[] }` (upserts site `CatalogTag` rows).
- `PUT .../sections/highlights` — `{ highlights[] }`.

Product image uploads use `feature=products`: `POST /api/v1/media/images`. Category banners continue to use `feature=categories`.

### Admin Stock Management (implemented)

Site-scoped inventory overview and absolute quantity updates. Reuses existing `Product` / `ProductVariant` / `InventoryItem` (no new Prisma fields). Never trusts client `siteId`; ownership is enforced via `requireSiteAccess` + variant→product→site lookup.

- `GET /api/v1/admin/sites/:siteCode/stock` — Bearer admin JWT + `requireSiteAccess`. Paginated product stock rows (newest `updatedAt` first). Response `data` is an array; pagination in top-level `meta` (`page`, `limit`, `total`, `totalPages`).
  - Query: `q` (max 120; name / productCode / slug), `status` (`all` default | `active` | `draft` | `archived`, case-insensitive aliases `ACTIVE`/`DRAFT`/`ARCHIVED`), optional `categoryId` (root category UUID — products under that root’s subcategories), optional `subcategoryId`, `page` (default 1), optional `offset` (overrides `(page-1)*limit`), `limit` (default `10`, max `48`).
  - Each row: `id`, `productCode`, `name`, `status` (`DRAFT`|`ACTIVE`|`ARCHIVED`), `imageUrl` (primary gallery → banner → variant profile), `price` / `vendorPrice` / `currency` (from first variant; null when missing), `subcategoryId` / `subcategoryName`, `categoryId` / `categoryName`, `isSimpleOffer` (true when zero variants or a single base offer with no size/color), `quantity` (simple: that offer’s on-hand; multi: sum), `variants[{ id, name, sizeLabel, colorLabel, quantity, isActive }]`, `updatedAt`.
- `PATCH /api/v1/admin/sites/:siteCode/stock/variants/:variantId` — body `{ quantity }` (absolute non-negative integer). Sets `InventoryItem.quantityOnHand` (creates row if missing) and writes an `ADJUSTMENT` `InventoryMovement` when the value changes. `404` if variant missing or belongs to another site.

Admin UI badge colors (display only): qty `> 10` green; `5 < qty ≤ 10` yellow; `qty ≤ 5` red.

### Admin Update Product Prices (implemented)

Site-scoped percent price adjustments on `ProductVariant`. No new Prisma models. Server always recomputes amounts from `percent` + current DB values (never trusts client final prices). Auth: Bearer admin JWT + `requireSiteAccess`.

**Percent rules:** `percent` must be non-zero, `> -100` and `≤ 1000`. Positive values increase by that percent; negative values decrease. Money is rounded to 2 decimal places and clamped at `0`.

**Fields updated per variant:**
- `price` (selling / list) — always
- `vendorPrice` — when currently set (null stays null)
- `compareAtPrice` (MRP / compare-at) — when currently set (null stays null)

- `GET /api/v1/admin/sites/:siteCode/product-prices` — paginated preview/list (newest `updatedAt` first). Response `data` array; pagination in `meta`.
  - Query: `q` (max 120), `status` (`all` default | `active` | `draft` | `archived`), optional `categoryId` (root category; products under that root’s subcategories), optional `subcategoryId`, optional `productId`, optional `percent` (when set, each row includes projected `updatedPrice` / `updatedVendorPrice` / per-variant `updated*`), `page` (default 1), optional `offset`, `limit` (default `10`, max `48`).
  - Category / product must belong to the site (`404` otherwise). Subcategory must be a child of `categoryId` when both are provided.
  - Row shape mirrors stock list identity fields plus variant price detail: `variants[{ id, name, sizeLabel, colorLabel, isActive, price, updatedPrice, vendorPrice, updatedVendorPrice, compareAtPrice, updatedCompareAtPrice, currency }]`.
- `POST /api/v1/admin/sites/:siteCode/product-prices/apply` — body `{ percent, categoryId? | productId?, subcategoryId?, status?, q? }`. Exactly one of `productId` or `categoryId`. Optional `subcategoryId` narrows category scope (omit = all subcategories under the category). Applies to **all** matching products (not just the current page). Returns `{ percent, productsUpdated, variantsUpdated, items[] }` with post-update current prices. Significant changes are logged (`event: product_prices.percent_applied`).

Admin UI: `/admin/{siteCode}/products/update-prices` (module `update-product-prices`).

### Admin coupons (implemented)

- `GET /api/v1/admin/sites/:siteCode/coupons` — Bearer admin JWT; `requireSiteAccess`. Lists all coupons for the site (including inactive).
- `POST /api/v1/admin/sites/:siteCode/coupons` — create. Body: `code` (required; stored uppercase), exactly one of `amount` or `percent` (mutually exclusive; percent 0–100 exclusive of 0), `startsAt` / `endsAt` as `YYYY-MM-DD` with `endsAt >= startsAt`, optional `isActive` (default true). Maps to `CouponType` `FIXED_AMOUNT` or `PERCENTAGE` + `value`.
- `PUT /api/v1/admin/sites/:siteCode/coupons/:couponId` — replace fields (same body rules); 404 if missing/other site; 409 on duplicate code for the site.
- `PATCH /api/v1/admin/sites/:siteCode/coupons/:couponId` — body `{ isActive: boolean }` toggles active status.
- `DELETE /api/v1/admin/sites/:siteCode/coupons/:couponId` — blocked with 409 when the coupon is assigned to any product (`ProductCoupon` Restrict).

Product-edit coupon options use the same `Coupon` model, scoped to the product’s site and active `PERCENTAGE` / `FIXED_AMOUNT` rows only.

### Public categories (storefront)

- `GET /api/v1/sites/:siteCode/category` — public read; active root categories only (name/slug/order) for `/category` grid.
- `GET /api/v1/sites/:siteCode/category/:categorySlug` — public read by slug or name; returns category with active subcategories (including subcategory `bannerUrl`) and their active products for `/category/[categoryName]`.

### Public products (storefront)

- `GET /api/v1/sites/:siteCode/products` — public list of ACTIVE products for an active site (no auth). Includes both **DIRECT** and **CATEGORY** products (no `productType` filter). Response `data` is an array of product cards; pagination/filter metadata is returned in top-level `meta` (`page`, `limit`, `total`, `totalPages`).
  - Query (allowlisted): `q` (max 120), `categorySlug` (root category slug; products under that root’s active subcategories — **DIRECT** products have no subcategory and are excluded when this filter is set), `priceMin` / `priceMax` (first active variant price in INR rupees), `availability` (`in_stock` | `out_of_stock`), `sort` (`default` | `rating` | `price_asc` | `price_desc`), `page` (1-based, default 1), optional `offset` (preferred for infinite scroll with varying page sizes; when set, overrides `(page-1)*limit`), `limit` (default `15`, max `48`).
  - Card fields: `id`, `slug`, `name`, `categoryName` (null for DIRECT), optional `description` (HTML overview; null when empty), `price`, optional `compareAtPrice` (null when unset), `imageUrl` (HTTPS preferred), `averageRating` / `reviewCount`, `defaultVariantId`, `quantity`, and landing flags.
  - Landing rail may call with only `limit`; shop PLP uses filters + pagination.
- `GET /api/v1/sites/:siteCode/products/facets` — public read for shop filters: `{ categories: [{ id, name, slug, productCount, imageUrl }], price: { min, max } }`. Category image is the first ACTIVE product primary gallery image under that root (else null). Price min/max use each product’s first active variant by `createdAt` (same rule as cards). DIRECT products contribute to price min/max but not category product counts.
- `GET /api/v1/sites/:siteCode/products/highlights` — public read returning `{ recent, featured, bestSellers }` ACTIVE products flagged `isRecent` / `isFeatured` / `isBestSeller` (caps 4 / 8 / 4), including DIRECT. Same card shape as the list endpoint.
- `GET /api/v1/sites/:siteCode/products/:slug` — public read for an active site (no auth). Returns one ACTIVE product by site-scoped slug for the storefront PDP (`/products/[slug]`), including DIRECT. Draft/archived products return `404`. Prefer HTTPS Cloudinary image URLs. Static paths `/highlights` and `/facets` are registered before `/:slug`.

Admin catalog create/update/PATCH (subcategory and direct) also accept optional landing flags `isFeatured`, `isRecent`, `isBestSeller` (defaults false on create).

Response joins PDP-related data into one payload:
- Core: `id`, `siteCode`, `productCode`, `name`, `slug`, `description` (HTML), `isFeatured`, `isRecent`, `isBestSeller`, `subcategoryId`, optional `banner` / `sizeChart` media refs, `averageRating`, `reviewCount`
- `gallery[]` ordered with primary first (`imageUrl`, `imagePublicId`, `isPrimary`, `sortOrder`)
- Active `sizes[]` / `colors[]` (may be empty when the product sells a single base price)
- Active `variants[]` with mandatory `price` (INR rupees), `quantity` (inventory on hand), optional nullable `sizeLabel` / `colorLabel` (both null = base/default offer), optional `sku` / `profileImage`
- `videos[]`, `infoSections[]` (title + HTML body), active `editorialReviews[]`, `tags[]`, `highlights[]`
- Optional `tax` (`cgst`/`sgst`) and linked `coupon` summary for display
- `relatedProducts[]` — all other ACTIVE products in the same subcategory (current product excluded), each with `id`, `slug`, `name`, `categoryName`, `price`, `imageUrl`, `averageRating`, `reviewCount`, `defaultVariantId`, `quantity`, optional `coupon`, and optional `tax`

Do not create every endpoint at scaffold time. Add only endpoints needed for the current feature.

## 7. Pagination, filtering, and sorting

For list endpoints, standardize a documented approach such as:

Query:
- `page`: one-based positive integer, if page pagination is chosen.
- `limit`: positive integer capped by a server-defined maximum.
- `sort`: allowlisted field and direction.
- `q`: bounded search string where supported.
- filters: explicitly allowlisted, validated values.

Response metadata may include:

```json
{
  "page": 1,
  "limit": 20,
  "total": 0,
  "totalPages": 0
}
```

Do not interpolate client-supplied sort fields into raw SQL. Use allowlists and Prisma-safe query construction.

## 8. Idempotency and side effects

- Use idempotency for operations where retries could create duplicate orders, payment attempts, refunds, or other material effects.
- Treat Razorpay webhooks as retryable and potentially repeated.
- Persist provider event/reference IDs where useful to prevent duplicate processing.
- Use transactions for related database changes.
- Send email and other external side effects after the relevant transaction has safely committed, or use an outbox pattern if reliability requirements warrant it.

## 9. Endpoint implementation checklist

For every new endpoint, document and implement:
- [ ] Purpose and method/path
- [ ] Authentication requirements
- [ ] Permission and site-scope requirements
- [ ] Zod schemas for params/query/body
- [ ] Success response schema and status
- [ ] Error codes and statuses
- [ ] Business rules and database side effects
- [ ] Rate limit / abuse considerations
- [ ] Logs that are safe and useful
- [ ] Unit tests for business logic
- [ ] API/integration tests for HTTP behavior, validation, authorization, and side effects
- [ ] API documentation updated
