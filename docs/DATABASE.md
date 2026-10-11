# Database Design and Data Integrity
## SkinDx Bioc platform

**Database:** PostgreSQL  
**ORM:** Prisma  
**Status:** Conceptual baseline; confirm business rules before finalizing schema and migrations.

## 1. Database principles

- PostgreSQL is the source of truth for customers, products, inventory, orders, payment records, enquiries, content, and permissions.
- Use Prisma schema and committed migrations to evolve the database.
- Prefer normalized relational data where relationships and integrity matter.
- Use database constraints in addition to application validation.
- Keep site scope explicit.
- Store money in integer minor units plus an ISO currency code; do not use floating-point types for money.
- Never store card numbers or CVVs.
- Avoid destructive migrations without a reviewed migration and backup plan.

## 2. Proposed entity groups

### Site and content
- `Site`: stable code (`IN`, `COM`), canonical host/domain, active flag, settings relationship.
- `CompanyBasicInfo` (implemented): one optional row per site (`siteId` unique). Stores company name/domain, contact numbers, WhatsApp, emails, office addresses, map/social/SEO/tracking fields, and logo URL/publicId pairs. Cascade delete with `Site`.
- `NavbarSection` / `NavbarSubSection` (implemented): site-scoped header navigation. Each section has title, url, active, order; optional child sub-sections with the same fields. Cascade delete with `Site` / parent section. Indexed by `(siteId, order)` and `(sectionId, order)`.
- `SocialPost` (implemented): site-scoped Instagram/Facebook posts (`postType` enum `INSTAGRAM` | `FACEBOOK`), thumbnail `imageUrl`/`imagePublicId`, external `postUrl`, `active`, `order`. Cascade delete with `Site`. Indexed by `(siteId, order)`, `(siteId, postType, order)`, and `(siteId, active, order)`.
- `GalleryItem` (implemented): site-scoped lookbook media (`mediaType` enum `IMAGE` | `VIDEO`), `mediaUrl`/`mediaPublicId`, optional `title`/`caption`, `active`, `order`. Cascade delete with `Site`. Indexed by `(siteId, order)`, `(siteId, active, order)`, and `(siteId, mediaType, order)`.
- `FooterConfig` / `FooterColumn` / `FooterLink` (implemented): one optional footer config per site (`siteId` unique) with thank-you line, description, and ordered columns of links (`label`, `url`, `active`, `order`). Nested rows cascade with the parent config / site. Logo and social links live on `CompanyBasicInfo`, not footer config.
- `Page` / `ContentEntry`: site, slug, title, structured content, publication status, SEO metadata.
- `Banner`, `FAQ`, `BlogPost`, `SiteSetting`: site-scoped where the content/settings differ.
- `MediaAsset`: provider, provider asset/public ID, URL, file type, dimensions, alt text, ownership/creation metadata.

### Catalog
- `Product`: core product identity, SKU strategy, descriptive/specification data, active status.
- `ProductVariant`: variant-specific SKU, pack size or option, barcode where applicable, active status.
- `Category`: hierarchical category data if needed.
- `ProductCategory`: join table if products may belong to multiple categories.
- `SiteProduct` or equivalent: per-site visibility, merchandising, and site-specific fields when needed.
- `ProductMedia`: ordered media associations and alt text.
- `Inventory` / `InventoryMovement`: stock quantities, reservations, adjustments, and auditable changes.

Confirm whether pricing and descriptions are globally shared or site-specific before deciding which fields live on `Product` versus a site-product relation.

### Customer and access
- `User`: identity and account status; avoid unnecessary sensitive fields. Implemented fields include optional `passwordHash`, `emailVerifiedAt`, `welcomeEmailSentAt`, `status` (including `PENDING_VERIFICATION`), and `role`.
- `ExternalIdentity`: provider and provider subject ID for Google identity mapping (implemented: unique `(provider, providerUserId)`, FK to `User`; `User.passwordHash` is optional for Google-only customers).
- `EmailVerificationToken`: hashed OTP/verification credential, purpose (`EMAIL_VERIFICATION`), expiry, attempt count, consumed timestamp (implemented). Never store plaintext OTPs.
- `EmailOutbox`: minimal transactional email outbox (`templateKey`, `payloadJson`, status PENDING/SENT/FAILED) for reliable welcome-email delivery after verification.
- `Address`: customer-owned delivery/billing addresses.
- `Role`, `Permission`, `RolePermission`, `UserRole` or a simpler equivalent RBAC model.
- `AdminAuditLog`: actor, action, target, timestamp, and safe metadata.
- `RefreshToken`: hashed refresh JWT, expiry, and `revokedAt` for rotation/reuse detection (implemented).

Do not use a user-supplied email as the only permanent external identity key. Store the verified provider subject identifier.

### Commerce
- `Cart`, `CartItem`: current cart state according to guest/customer-cart policy.
- `Coupon`, `CouponRedemption`: eligibility and redemption constraints.
- `Order`: customer/contact snapshot, address snapshot, totals, currency, status, site, timestamps.
- `OrderItem`: immutable purchase-time snapshot of product name/SKU/variant, quantity, unit amount, discount/tax breakdown as applicable.
- `PaymentAttempt` / `Payment`: provider references, amount, currency, status, verified timestamps, and safe metadata.
- `Refund`: provider reference, amount, status, and audit trail where refunds are supported.
- `Shipment` / `Fulfilment`: carrier reference, shipping state, and timestamps if fulfilment tracking is in scope.

### Enquiries and communication
- `Enquiry`: originating site, contact details, subject/message, status, timestamps, and assigned staff if needed.
- `EmailDelivery` or notification/outbox records if reliable delivery tracking/retries are required.
- `Review`: customer/order/product association and moderation status if reviews are in scope.

## 3. Relationships and constraints

Examples to decide and enforce:
- Each site-scoped page has one owning site; `(siteId, slug)` should usually be unique.
- SKU uniqueness must follow the chosen business rule (global SKU or site-specific SKU).
- An order has one or more order items and may have payment attempts.
- Order items preserve purchase-time price and product snapshots even if catalog data changes later.
- External identity provider/subject pairs should be unique.
- A coupon redemption must enforce the configured per-user/global usage policy.
- Inventory changes should be traceable; avoid silently overwriting stock without an adjustment record where auditability is required.
- Use foreign keys, unique constraints, check constraints, and indexes where they protect real invariants.

## 4. Multi-site data separation

- Store site ownership/association explicitly; do not rely only on URL slugs or frontend filters.
- Use server-side site resolution and authorization.
- Add site scope to relevant query predicates and uniqueness constraints.
- Distinguish truly shared catalog entities from per-site presentation/visibility.
- Do not assume that `.com` enquiry submissions are ecommerce orders.
- Add automated tests proving `.com` users/admins cannot access unauthorized `.in` data and vice versa.

One PostgreSQL database can support both sites. Separate databases are not required solely because there are two domains.

## 5. Order and payment integrity

- Calculate price, discounts, tax, shipping, and total on the backend from trusted records.
- Store currency with every monetary aggregate/transaction.
- Use transactions for order creation, inventory reservation, and related database state changes.
- Define whether stock is reserved at checkout creation, payment initiation, or another documented point.
- Define reservation expiry and release behavior for abandoned/failed payments.
- Payment status must be driven by verified server-side provider responses/webhooks and reconciliation—not browser claims.
- Make webhook event processing idempotent.
- Keep order status and payment status separate; an order may exist while payment is pending or failed.
- Preserve records needed for refunds, reconciliation, customer support, and audit requirements.

## 6. Prisma and migration workflow

1. Update `schema.prisma`.
2. Review the schema diff and relation/index choices.
3. Generate a development migration with a descriptive name.
4. Review the generated SQL for destructive or unexpected changes.
5. Generate Prisma Client.
6. Update repository/service logic and test fixtures.
7. Run migration tests against a disposable test database.
8. Commit schema and migration together.
9. Deploy reviewed migrations with a backup/recovery plan.

Never run a development database reset command against production. Do not edit an already-applied production migration; create a new migration.

## 7. Indexing and performance

Consider indexes for:
- Unique email/identity lookups according to normalization policy.
- Site + slug for public content.
- Product status/category/SKU/search fields used in real queries.
- Order customer + created timestamp.
- Provider payment/order references.
- Enquiry status + created timestamp.
- Foreign keys and frequently filtered fields.

Do not add every possible index blindly; indexes have write and storage costs. Validate with query plans and real usage.

## 8. Deletion, privacy, and retention

- Define whether each entity is hard-deleted, soft-deleted, anonymized, or retained for business/legal reasons.
- Avoid cascading deletion of financial/audit records without a reviewed policy.
- Define customer account deletion/export processes where required.
- Keep backups and logs within an approved retention policy.
- Do not place secrets or unnecessary personal data in JSON metadata or audit logs.

## 9. Database review checklist

Before a schema change is merged:
- [ ] Relationships and cardinality are explicit.
- [ ] Required fields, unique constraints, and indexes are reviewed.
- [ ] Site scope is correct.
- [ ] Money uses integer minor units and currency.
- [ ] Order snapshots preserve historical values.
- [ ] Sensitive data is minimized.
- [ ] Migration is non-destructive or has an approved recovery plan.
- [ ] Repository/service tests cover behavior and constraints.
- [ ] Integration tests run against PostgreSQL, not only mocked Prisma calls.
