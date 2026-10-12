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

- `POST /api/v1/auth/register` — body `{ name, email, password, confirmPassword }`. Creates `PENDING_VERIFICATION` customer, stores hashed email OTP, sends Brevo OTP for site `IN`. Returns `{ verificationRequired: true, email }`. **No session / tokens.** Conflicts with existing Active or Google-only accounts → `409`.
- `POST /api/v1/auth/verify-email` — body `{ email, otp }`. Atomically consumes OTP, activates account, schedules welcome email once, returns `{ accessToken, user }` + refresh cookie.
- `POST /api/v1/auth/resend-verification` — body `{ email }`. Generic acknowledgement; enforces resend cooldown.
- `POST /api/v1/auth/login` — body `{ email, password }`. Verified customers get `{ accessToken, user }` + refresh cookie. Invalid credentials → generic `401`. Unverified → `403` with `errors.code = EMAIL_NOT_VERIFIED`. Suspended/inactive → `403`. Never grants admin.
- `PATCH /api/v1/auth/password` — authenticated customer. Body `{ currentPassword?, newPassword, confirmPassword }`. When `hasPassword` is true, `currentPassword` is required and verified. Google-only accounts (no password hash) may set a password without `currentPassword`. On success: hash stored, all refresh tokens revoked, new `{ accessToken, user }` issued with rotated refresh cookie. Never returns password data.

Auth `user` DTO fields include: `id`, `email`, `role`, `firstName`, `lastName`, `imageUrl`, `hasPassword`, `linkedProviders` (`GOOGLE` from `ExternalIdentity` only — never inferred from `imageUrl`), `createdAt`.

### Customer account self-service (implemented)

All routes require `Authorization: Bearer` and `CUSTOMER` role. Ownership is always derived from `req.user.id`.

- `PATCH /api/v1/me` — body `{ firstName, lastName? }`. Updates name only; never accepts role/status/email/password.
- `GET /api/v1/me/addresses` — list current customer's addresses.
- `POST /api/v1/me/addresses` — create address; `isDefault: true` clears other defaults in a transaction.
- `PATCH /api/v1/me/addresses/:addressId` — update owned address only (404 if not owned).
- `DELETE /api/v1/me/addresses/:addressId` — delete owned address only (404 if not owned).
- `GET /api/v1/orders?page&pageSize` — paginated orders for the authenticated customer only.
- `GET /api/v1/orders/:orderId` — order detail with items; 404 if not owned.
- `GET /api/v1/wishlist` — current wishlist (created if missing) with product summary fields.
- `POST /api/v1/wishlist` — body `{ productId, variantId? }`; active `IN` products only; conflict if duplicate.
- `DELETE /api/v1/wishlist/items/:itemId` — remove owned wishlist item only.

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

## 6. Planned endpoint groups

These are initial route groups to consider; define exact paths and schemas as features are implemented.

| Group | Example purpose | Access |
|---|---|---|
| `/auth` | signup, login, logout, Google auth, verification, password reset | Public/rate-limited or authenticated depending on operation |
| `/me` | current customer profile and addresses | Customer |
| `/products` | catalog, product details, search, filtering | Public read; admin write |
| `/categories` | catalog category data | Public read; admin write |
| `/cart` | retrieve/update current cart | Customer or supported guest-cart mechanism |
| `/wishlist` | current customer's wishlist | Customer |
| `/coupons` | validate coupon eligibility | Public/customer with rate limits; admin management |
| `/checkout` | calculate server-authoritative totals and create checkout/order intent | Customer/guest policy |
| `/orders` | create/read/cancel where permitted | Customer; admin permissions for management |
| `/payments` | payment initiation/status | Customer plus backend verification |
| `/webhooks/razorpay` | signed provider events | Provider signature verification; not browser auth |
| `/enquiries` | submit and manage enquiries | Public submission with abuse controls; admin read/manage |
| `/content` | public pages, banners, FAQs, blog content | Public read; admin write |
| `/media` | signed upload authorization and asset management | Authorized admin/editor |
| `/admin/sites` | list/manage authorized site workspaces | Admin permission |
| `/admin/sites/:siteCode/dashboard` | site-scoped dashboard metrics | Admin + site access |
| `/admin/sites/:siteCode/company-basic-info` | get/upsert site-scoped company profile | Admin + site access |
| `/admin/sites/:siteCode/navbar-sections` | list/create site-scoped navbar sections | Admin + site access |
| `/admin/sites/:siteCode/social-posts` | CRUD site-scoped Instagram/Facebook posts | Admin + site access |
| `/admin/sites/:siteCode/gallery` | CRUD site-scoped gallery images/videos | Admin + site access |
| `/admin/sites/:siteCode/customer-reviews` | CRUD site-scoped curated customer testimonials | Admin + site access |
| `/admin/sites/:siteCode/footer` | get/upsert site-scoped footer config | Admin + site access |
| `/admin/sites/:siteCode/top-advertisement` | get/upsert site-scoped top advertisement (3 sections) | Admin + site access |
| `/admin/sites/:siteCode/about-us-banner` | get/upsert site-scoped About Us home banner (3 sections) | Admin + site access |
| `/admin/sites/:siteCode/faq` | get/upsert site-scoped FAQ sections and questions | Admin + site access |
| `/admin/sites/:siteCode/hero-banners` | get/upsert site-scoped home hero carousel slides | Admin + site access |
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

Site-scoped lookbook media (`mediaType`: `image` | `video`) for IN and COM.

- `GET /api/v1/admin/sites/:siteCode/gallery` — Bearer admin JWT; `requireSiteAccess`. Optional query `mediaType`. Returns all items for the site (including inactive), newest first by `createdAt`.
- `POST /api/v1/admin/sites/:siteCode/gallery` — create. Body: `mediaType`, `mediaUrl`, `mediaPublicId`, optional `active`. `siteId` from authenticated site context only. Prefer HTTPS media URLs.
- `PUT /api/v1/admin/sites/:siteCode/gallery/:itemId` — full update within the site (`mediaType`, `mediaUrl`, `mediaPublicId`, `active`).
- `PATCH /api/v1/admin/sites/:siteCode/gallery/:itemId` — partial update of `active` only.
- `DELETE /api/v1/admin/sites/:siteCode/gallery/:itemId` — delete within the site.

Uploads use existing media APIs with `feature=gallery`: `POST /api/v1/media/images` and `POST /api/v1/media/videos`.

### Public gallery (storefront)

- `GET /api/v1/sites/:siteCode/gallery` — public read for an active site (no auth). Returns active items only (media fields + `active`), newest first, for the `.in` storefront lookbook masonry.

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
