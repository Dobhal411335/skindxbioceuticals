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
- `GalleryItem` (implemented): site-scoped lookbook items (`mediaType` enum `IMAGE` | `VIDEO` | `TEXT_CARD`). Media rows use `mediaUrl`/`mediaPublicId` plus optional `clickUrl` (storefront wrap link). Text cards use `heading`, `description`, `buttonLabel`, `buttonUrl` (media fields empty). `active` flag. Cascade delete with `Site`. Indexed by `(siteId, createdAt)`, `(siteId, active, createdAt)`, and `(siteId, mediaType, createdAt)`. Migration: `20261014210000_gallery_text_cards_and_click_url`.
- `CustomerReview` (implemented): site-scoped curated storefront testimonials (`customerName`, `designation`, `description`, `rating` 1–5, `imageUrl`/`imagePublicId`, `active`, `order`). Distinct from product `Review` moderation. Cascade delete with `Site`. Indexed by `(siteId, order)` and `(siteId, active, order)`.
- `DoctorProfile` (implemented): site-scoped clinician cards for `/doctors` (`name` stored as `Dr. …`, `specialization`, `about`, `experienceYears`, `state` (Indian state/UT), `city`, `photoUrl`/`photoPublicId`, `active`, `order`). Cascade delete with `Site`. Indexed by `(siteId, order)` and `(siteId, active, order)`. Migrations: `20261013230000_add_doctor_profiles_and_page`, `20261014100000_doctor_profile_location_and_appointments` (replaces removed `consultancyType` with `state`/`city`).
- `DoctorAppointment` (implemented): site-scoped appointment requests from storefront doctor cards (`doctorId` FK → `DoctorProfile`, `patientName`, `email`, `scheduledAt`, `problem`, `status` enum `NEW` | `CONTACTED` | `CLOSED` | `CANCELLED`). Cascade delete with `Site` / doctor. Indexed by `(siteId, scheduledAt)`, `(siteId, doctorId, scheduledAt)`, and `(siteId, status)`. Migrations: `20261014100000_doctor_profile_location_and_appointments`, `20261014110000_doctor_appointment_status_cancelled`.
- `DoctorPageConfig` / `DoctorServiceItem` (implemented): one optional doctors landing config per site (`siteId` unique). About fields: heading, description, `aboutHighlights` JSON string array, CTA label/url, primary + optional secondary image URL/publicId, optional `experienceYears` badge. Services section heading/subheading plus nested `DoctorServiceItem` rows (`iconKey` Lucide name, `name`, `description`, `readMoreUrl`, `order`, `active`). Nested services cascade with the parent config / site. Indexed by `(configId, order)`. Migration: `20261013230000_add_doctor_profiles_and_page`.
- `FooterConfig` / `FooterColumn` / `FooterLink` (implemented): one optional footer config per site (`siteId` unique) with thank-you line, description, and ordered columns of links (`label`, `url`, `active`, `order`). Nested rows cascade with the parent config / site. Logo and social links live on `CompanyBasicInfo`, not footer config.
- `TopAdvertisementConfig` / `TopAdvertisementItem` (implemented): one optional top-advertisement config per site (`siteId` unique) with typed items (`section` enum `ANNOUNCEMENT` | `UTILITY` | `BENEFIT`). Each item has `text`, optional `url`, and `active`. Nested items cascade with the parent config / site. Indexed by `(configId, section)`.
- `PopupBannerConfig` (implemented): one optional landing popup banner per site (`siteId` unique). Fields: `imageUrl`/`imagePublicId`, `miniHeading`, `heading`, `subDescription`, `buttonLabel`, `buttonUrl`, `active` (default false). Cascade delete with `Site`. Migration: `20261013220000_add_popup_banner_config`.
- `AboutUsBannerConfig` / `AboutUsAboutCard` / `AboutUsHighlightItem` / `AboutUsTextSlide` (implemented): one optional About Us home banner config per site (`siteId` unique). Parent holds promo header fields (`promoLabel`, `promoHeading`, `promoSubheading`, `promoButtonLabel`, `promoButtonUrl`). Nested about cards include image URL/publicId, label, heading, description, button label/url, `sortOrder`, `active`. Highlight items include image URL/publicId, heading, button label/url, `sortOrder`, `active`. Text slides include heading, subheading, `sortOrder`, `active`. Nested rows cascade with the parent config / site. Indexed by `(configId, sortOrder)` on each child table.
- `PromoBannerConfig` / `PromoBannerItem` (implemented): one optional promo banner row config per site (`siteId` unique). Items store `imageUrl`/`imagePublicId`, optional `buttonUrl`, `sortOrder`, `active`. Nested items cascade with the parent config / site. Indexed by `(configId, sortOrder)`. Migration: `20261013200000_add_promo_and_collection_banners`.
- `CollectionBannerConfig` / `CollectionBannerItem` (implemented): one optional post-gallery collection banner config per site (`siteId` unique). Parent holds `sectionLabel` and `sectionHeading`. Items store `imageUrl`/`imagePublicId`, `title`, `description`, optional `buttonUrl`, `sortOrder`, `active`. Nested items cascade with the parent config / site. Indexed by `(configId, sortOrder)`. Migration: `20261013200000_add_promo_and_collection_banners`.
- `FaqSection` / `FaqItem` (implemented): site-scoped FAQ groups. Each section has `title`, `order`, `active`. Nested items have `question`, `answer`, `showOnLanding`, `order`, `active`. Cascade delete with `Site` / parent section. Indexed by `(siteId, order)`, `(siteId, active, order)`, `(sectionId, order)`, `(sectionId, active, order)`, and `(sectionId, showOnLanding)`.
- `InsightCard` / `InsightQa` (implemented): site-scoped landing Insights strip (not Blog CMS). Cards: `category`, `name`, `publishedAt`, `imageUrl`/`imagePublicId`, TipTap HTML `description`, `order`, `active`. Q&A: `question`, TipTap HTML `answer`, `order`, `active`. Cascade delete with `Site`. Indexed by `(siteId, order)` and `(siteId, active, order)` on both tables. Migration: `20261013180000_add_insight_cards_and_qa`.
- `HeroBannerSlide` / `HeroBannerGridImage` (implemented): site-scoped home hero carousel slides. Each slide has `layoutType` enum `FULL_WIDTH` | `SPLIT_DUAL` | `MULTI_IMAGE`, `order`, `active`. Columns cover all layouts: mobile/desktop image URL/publicId (used by `FULL_WIDTH`), copy/CTA fields (used by `SPLIT_DUAL` / `MULTI_IMAGE`), left/right side image URL/publicId (used by `SPLIT_DUAL`). Unused fields for a layout are stored empty. Multi-image slides nest 4–6 `HeroBannerGridImage` rows (`imageUrl`/`imagePublicId`, `alt`, `order`). Cascade delete with `Site` / parent slide. Indexed by `(siteId, order)`, `(siteId, active, order)`, and `(slideId, order)`.
- `Page` / `ContentEntry`: site, slug, title, structured content, publication status, SEO metadata.
- `Banner`, `FAQ`, `SiteSetting`: site-scoped where the content/settings differ.
- `Blog` (implemented): site-scoped articles (`name`, `slug` unique per site, `category` string, `title`, `publishedAt`, `createdBy`, `imageUrl`/`imagePublicId`, HTML `description`, `blockquote`, `active`). Cascade delete with `Site`. Indexed by `(siteId, active, publishedAt)`, `(siteId, category, active, publishedAt)`, and `(siteId, createdAt)`. Replaces the unused global `blog_posts` scaffold. Migration: `20261013170000_site_scoped_blogs`.
- `MediaAsset`: provider, provider asset/public ID, URL, file type, dimensions, alt text, ownership/creation metadata.

### Catalog
- `Category` (phase 1 implemented): site-scoped hierarchical categories. Fields: `siteId`, `name`, `slug` (unique per site), optional `description`, `parentId` (null = main category; set = subcategory), optional `bannerUrl`/`bannerPublicId` (**subcategories only**; roots keep these null), `isActive`, `sortOrder`. Cascade delete with `Site` and parent category. Indexed by `(siteId)`, `(siteId, parentId)`, `(siteId, isActive, sortOrder)`.
- `Product` (phase 1 + edit details): site-scoped. Fields: `productCode` (unique per site), optional `subcategoryId` FK to `Category` (Restrict on delete), `productType` (`DIRECT` | `CATEGORY`, default `CATEGORY`), `description` (overview HTML/text), optional `sizeChartUrl`/`sizeChartPublicId`, optional `bannerUrl`/`bannerPublicId` (logo/banner for Product Gallery admin section), `status` (`DRAFT`/`ACTIVE`/`ARCHIVED`), landing flags `isFeatured` / `isRecent` / `isBestSeller` (booleans, default false). Slug unique per site. Indexed by `(subcategoryId)`, `(siteId, productType)`, `(siteId, status)`, and `(siteId, status, isFeatured|isRecent|isBestSeller)`. Migrations: `20261013143000_product_landing_flags`, `20261019100000_product_type_direct_category` (backfill: rows with `subcategory_id` → `CATEGORY`, else `DIRECT`).
  - **CATEGORY**: requires `subcategoryId`; created under Manage Products & Category (subcategory product APIs).
  - **DIRECT**: `subcategoryId` null; created via Admin Add Direct Product (`/products/direct`). Still editable via product edit / stock / prices; PDP by slug unchanged. ACTIVE DIRECT products appear in public landing rail/highlights/list alongside CATEGORY products.
- `ProductCategory`: join table retained; phase 1 also writes the product↔subcategory link here when creating/updating **CATEGORY** catalog products (not written for DIRECT).
- `CatalogColor` / `CatalogTag` (implemented): site-scoped masters for color hex/name and tag names. Unique `(siteId, hex)` / `(siteId, name)` for colors; unique `(siteId, name)` for tags.
- `ProductSize`: product-linked size labels (`label`, `sortOrder`, `active`); unique `(productId, label)`. Optional for catalog products — empty means the storefront shows no size selector.
- `ProductColor`: product-linked colors, optional FK to `CatalogColor`, plus `name`/`hex` for custom entries. Optional — empty means no colour swatches on the storefront.
- `ProductVariant` (extended for Price/Quantity): optional SKU (unique when set; not auto-generated for admin price/quantity offers), name, mandatory `price` (selling / list), optional `compareAtPrice` (MRP / compare-at), optional `vendorPrice`, optional nullable `sizeLabel` / `colorLabel` (both null = single base/default offer), `weightGrams`, profile image URL/publicId, `subImages` JSON, inventory via `InventoryItem`. No size/color FK columns — labels are denormalized strings. Variants referenced by cart/order are soft-deactivated instead of hard-deleted. Admin **Update Product Prices** applies a server-computed percent to `price` and, when set, `vendorPrice` + `compareAtPrice` (no separate price-adjustment table; audit via structured logger).
- `ProductGalleryImage`: ordered product gallery with `imageUrl`/`imagePublicId`, `isPrimary`, `sortOrder` (admin gallery section; distinct from legacy `ProductMedia` Media FK).
- `ProductVideo`, `ProductInfoSection`, `ProductHighlight`, `ProductEditorialReview`: product-detail content sections (videos, info tabs, highlights, admin-curated reviews distinct from customer `Review`).
- `ProductTag`: join `Product` ↔ `CatalogTag`.
- `ProductTax`: one optional CGST/SGST row per product.
- `ProductCoupon`: optional one coupon link per product (`Coupon` FK Restrict).
- `ProductMedia`: legacy Media FK associations retained for later storefront wiring.
- `InventoryItem` / `InventoryMovement`: stock quantities (`quantityOnHand`, `quantityReserved`, `lowStockThreshold`), reservations, adjustments, and auditable changes. Admin Stock Management lists products with variants and patches absolute `quantityOnHand` per variant (site-scoped); each non-zero delta writes an `ADJUSTMENT` movement with `referenceType=admin_stock`. No extra stock columns on `Product` — qty always lives on the variant’s inventory row.

Phase-1 create/list uses name + code under a subcategory (**CATEGORY**) or without (**DIRECT**); full edit details are managed via admin product edit section APIs. Public storefront PDP reads ACTIVE products by `(siteId, slug)` and joins gallery, sizes, colors, variants+inventory, info sections, and related same-subcategory products when `subcategoryId` is set (DIRECT products have an empty related list).

### Customer and access
- `User`: identity and account status; avoid unnecessary sensitive fields. Implemented fields include optional `passwordHash`, optional unique `username` (vendor login), optional `imageUrl` (Google picture or customer-uploaded avatar via `POST /me/avatar`), `emailVerifiedAt`, `welcomeEmailSentAt`, `status` (including `PENDING_VERIFICATION`), and `role` (`CUSTOMER` | `VENDOR` | `ADMIN` | `SUPER_ADMIN`).
- `VendorApplication` (site-scoped): multi-step become-vendor applications with business/contact/address/bank/compliance fields, document JSON refs (`{ url, publicId }`), `status` (`PENDING`|`APPROVED`|`REJECTED`), `isActive`, and on approve `username` + `passwordHash` + `passwordPlain` (plain retained for admin eye-toggle per product decision) linked to a `User` with role `VENDOR`. Unique `(siteId, email)` and `(siteId, mobile)`. Migration: `20261018100000_vendor_applications_and_vendor_role`.
- `ExternalIdentity`: provider and provider subject ID for Google identity mapping (implemented: unique `(provider, providerUserId)`, FK to `User`; `User.passwordHash` is optional for Google-only customers).
- `EmailVerificationToken`: hashed OTP/verification credential, purpose (`EMAIL_VERIFICATION`), expiry, attempt count, consumed timestamp (implemented). Never store plaintext OTPs.
- `EmailOutbox`: minimal transactional email outbox (`templateKey`, `payloadJson`, status PENDING/SENT/FAILED) for reliable welcome-email delivery after verification.
- `Address`: customer-owned delivery/billing addresses.
- `Role`, `Permission`, `RolePermission`, `UserRole` or a simpler equivalent RBAC model.
- `AdminAuditLog`: actor, action, target, timestamp, and safe metadata.
- `RefreshToken`: hashed refresh JWT, expiry, and `revokedAt` for rotation/reuse detection (implemented).

Do not use a user-supplied email as the only permanent external identity key. Store the verified provider subject identifier.

### Commerce
- `Cart`, `CartItem`: account cart for authenticated customers (`Cart.userId` unique). Guest cart for the `.in` storefront is browser `localStorage` only until login merge (no guest cart rows in PostgreSQL).
- `Wishlist`, `WishlistItem` (implemented): one wishlist per customer (`Wishlist.userId` unique). Items are product-level (`@@unique([wishlistId, productId])`) with optional `variantId` (`onDelete: SetNull`). No quantity field. Ecommerce writes/sync accept active `IN` products only; guest wishlist bags live in client `localStorage` and merge via `POST /wishlist/sync` (union by `productId`).
- `Coupon` (implemented admin CRUD): site-scoped discount codes (`siteId`, unique `(siteId, code)`). Stored as `type` (`PERCENTAGE` | `FIXED_AMOUNT` | `FREE_SHIPPING`) + `value`, plus optional `startsAt` / `endsAt`, `isActive`, usage fields. Admin create/edit supports amount **or** percent only (not both); `FREE_SHIPPING` is reserved for later checkout flows. Product-edit “Apply Coupon” lists active site coupons of type percent/amount.
- `CouponRedemption`: eligibility and redemption constraints (planned; not yet modeled).
- `Order` (checkout implemented): `userId` **nullable** (guest until linked); required `contactEmail` (normalized snapshot, indexed, not unique); totals as `Decimal(12,2)`; optional `confirmationEmailSentAt` for one-shot confirmation email. Migration: `20261014120000_checkout_payments_guest_orders`.
- `OrderItem`: immutable purchase-time snapshot of product name/SKU/variant, quantity, unit amount, line total.
- `GuestCheckoutSession`: opaque `tokenHash`, email, OTP hash/expiry/attempts, `emailVerifiedAt`, optional `orderId`, short-lived `confirmationTokenHash` for Thank You access.
- `Payment` (extended): Razorpay `providerOrderId` / `providerPaymentId` (unique), `amountInPaise`, `idempotencyScope`+`idempotencyKey` unique, `requestHash`, `failureCode`. Multiple rows per order allowed for retries; capture is conditional so inventory/email run once.
- `WebhookEvent`: unique `(provider, providerEventId)` for webhook dedupe.
- `Refund`: provider reference, amount, status, and audit trail where refunds are supported.
- `Shipment` / `Fulfilment`: carrier reference, shipping state, and timestamps if fulfilment tracking is in scope.

### Enquiries and communication
- `Enquiry`: originating site, contact details, subject/message, status, timestamps, and assigned staff if needed.
- `EmailDelivery` or notification/outbox records if reliable delivery tracking/retries are required.
- `Review`: customer/order/product association and moderation status if reviews are in scope.

## 3. Relationships and constraints

Examples to decide and enforce:
- Each site-scoped page has one owning site; `(siteId, slug)` should usually be unique.
- SKU uniqueness is global on `ProductVariant.sku` when a SKU is set; SKU is optional and is not auto-generated for admin price/quantity offers.
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
- Persist order tax snapshots at checkout: `Order.taxTotal`, `Order.cgstTotal`, `Order.sgstTotal`, and per-line `cgstPercent` / `sgstPercent` / `cgstAmount` / `sgstAmount` on `OrderItem` (do not recompute from live product tax for historical receipts).
- Store currency with every monetary aggregate/transaction.
- Use transactions for order creation, inventory reservation, and related database state changes.
- Stock is **reserved** when `POST /payments/create-order` succeeds (inventory `RESERVATION`). On Razorpay create failure, reservations are **released** and the order cancelled. On payment **capture** (verify or webhook), reservation converts to `STOCK_OUT` once.
- Abandoned pending payments: release/expiry job is a follow-up; failed create-order already releases.
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
