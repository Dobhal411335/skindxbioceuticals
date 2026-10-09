# Product Requirements Document (PRD)
## SkinDx Bioc e-commerce platform

**Status:** Initial baseline — confirm business-specific details before production  
**Products:** Pharmaceutical / skincare / biomedical products  
**Domains:** `.in` and `.com`  
**Last updated:** 2026-10-09

## 1. Product vision

Build two distinct public websites powered by one shared backend and managed through one admin experience.

- **`.in`** is the transactional ecommerce storefront: product discovery, customer accounts, cart, checkout, Razorpay payments, orders, and customer self-service.
- **`.com`** is primarily an informational and enquiry-focused website. It may display products and educational content, but enquiry/contact is its primary conversion path unless requirements later change.
- **One admin panel** lets authorized staff choose which site to manage and edit the content and settings permitted for that site.

The sites should share infrastructure and reusable business capabilities without forcing identical layouts, content, or conversion flows.

## 2. Goals

1. Launch the `.in` ecommerce storefront with a maintainable, secure foundation.
2. Support a separate `.com` experience without duplicating the backend.
3. Make site content and catalog presentation dynamic wherever appropriate.
4. Give authorized administrators one place to manage both sites.
5. Support Google sign-in, email communication, media management, and online payments through trusted providers.
6. Make security, accessibility, performance, SEO, and auditability part of the initial architecture.

## 3. Non-goals for the initial scaffold

Do not silently implement these before requirements are confirmed:
- Medical diagnosis, treatment recommendations, or symptom-based prescribing.
- Prescription workflows or sale of regulated products without verified legal/business requirements.
- Automatic claims that products cure, prevent, or treat diseases.
- Multi-vendor marketplace functionality.
- Multiple currencies, international shipping, subscriptions, loyalty points, or advanced ERP integrations.
- A custom payment-card storage system.
- Full `.com` implementation before the `.in` foundation is reviewed.

## 4. Users and roles

### Public/customer roles
- **Guest:** browse public pages and products; submit permitted enquiries; add items to a guest cart if enabled.
- **Customer:** register/sign in, manage profile and addresses, maintain cart/wishlist, place orders, view order history, and submit reviews if enabled.
- **Enquirer:** submit a `.com` enquiry with consent and contact details appropriate to the form.

### Admin roles
Use least-privilege role-based access control. Final roles must be confirmed with the business. Suggested starting roles:
- **Super Admin:** manage staff permissions, site settings, both site workspaces, and all administrative functions.
- **Site Admin:** manage assigned site content and catalog features.
- **Catalog Manager:** manage products, categories, variants, stock, and product media.
- **Order Manager:** view/manage orders and fulfilment without access to unnecessary account/security data.
- **Content Editor:** manage pages, banners, blog posts, FAQs, and other assigned content.
- **Enquiry Manager:** view and process `.com` enquiries.

Do not assume every staff member may access both sites or all customer data.

## 5. Site requirements

### 5.1 `.in` ecommerce storefront
- Responsive home page with editable promotional hero/banner areas.
- Product listing, categories, product detail pages, search, filtering, and sorting.
- Product attributes and variants where applicable.
- Clear price, availability, usage information, ingredients/specifications where supplied, warnings, and other legally reviewed product information.
- Cart, quantity changes, shipping calculation, coupon validation, and checkout.
- Customer signup/login, Google sign-in, logout, profile and address management.
- Razorpay checkout with server-side payment verification and webhook processing.
- Order confirmation, order history, order detail, and status tracking based on available fulfilment integration.
- Transactional emails through Brevo where configured.
- SEO metadata, canonical URLs, sitemap, robots rules, and structured data only where accurate.
- Accessible loading, empty, validation, success, and error states.

### 5.2 `.com` enquiry/content site
- Independently configurable header, footer, navigation, hero, page sections, and brand presentation.
- Company/about pages, product information, FAQs, educational/blog content, contact details, and enquiry forms as approved by the business.
- Product enquiry CTA and enquiry confirmation.
- Enquiries saved in the shared backend and available to authorized staff in the admin panel.
- Spam prevention, input validation, consent messaging, and email notification where configured.
- No ecommerce checkout requirement unless explicitly approved later.

### 5.3 Shared admin panel
- Authenticated, role-protected admin area.
- Landing screen/workspace selector for `.in` and `.com`.
- Clear visual indication of the selected site before saving changes.
- Site-specific content management: pages, banners, navigation, FAQs, blog posts, SEO metadata, and site settings.
- Catalog management for ecommerce products, categories, variants, pricing, and inventory.
- Order and payment-status visibility with restricted permissions.
- Enquiry management with status, assignment/notes if approved, and timestamps.
- Media library backed by Cloudinary.
- Admin user and role management restricted to authorized roles.
- Audit trail for sensitive or material changes.
- Confirmation for destructive actions and clear save/error feedback.

## 6. Dynamic content and site separation

- Avoid hardcoding business content into React components.
- Store editable content and settings in the database.
- Represent the site explicitly, for example with a `Site` record or stable site code such as `IN` and `COM`.
- Every site-specific page, banner, navigation item, SEO setting, and content record must be scoped to the correct site.
- Shared products may be linked to one or both sites, but site-specific visibility, copy, pricing, and availability rules must be explicit.
- Never trust a client-supplied site identifier as authorization. The backend must resolve the request's allowed site and enforce access.
- Keep global records separate from site-scoped records where a genuinely shared entity is required.

## 7. Integrations

- **Payments:** Razorpay. Create payment orders on the backend; verify signatures server-side; handle signed webhooks idempotently. Never treat a browser redirect alone as proof of payment.
- **Email:** Brevo for transactional email. Send from the backend; keep API keys secret; record delivery/error status as appropriate.
- **Media:** Cloudinary for image/media storage and transformations. Upload using a backend-issued signed upload flow or another securely configured method. Persist asset IDs and validated metadata.
- **Google sign-in:** use a supported OAuth/OIDC flow. Verify identity tokens on the backend and link accounts safely.
- **Icons:** Lucide React.
- **UI primitives:** shadcn/ui with project-owned styling and accessible behavior.

## 8. Suggested technology baseline

- Frontends: Next.js App Router + TypeScript; separate deployments for `.in` and `.com`.
- Backend: Node.js + TypeScript + Express.
- Database: PostgreSQL with Prisma ORM.
- Validation: Zod at API boundaries and for environment configuration.
- State: Redux Toolkit only for appropriate client/application state; do not put all server-fetched catalog data into Redux by default.
- HTTP client: centralized Axios instance on the frontend.
- Testing: unit, integration, and end-to-end tests for critical flows.
- Deployment and hosting choices remain to be decided.

## 9. Acceptance criteria for the foundation

- Frontends and backend run locally using documented commands.
- Strict TypeScript is enabled; no avoidable `any`.
- Environment variables are validated at startup and secrets are not committed.
- API uses a versioned base path such as `/api/v1`.
- Backend has consistent validation, error handling, logging, and response conventions.
- Database migrations are reproducible.
- Both sites are represented in the data model without duplicating the backend.
- Admin access is authenticated, authorized, site-scoped, and audited.
- Payment, OAuth, email, and media integrations have safe configuration boundaries.
- No fake payment success, insecure upload endpoint, or hardcoded production credentials exist.
- Critical auth, permissions, payment verification, and site-isolation behavior has automated tests.

## 10. Open questions to resolve before production

1. Exact product categories and whether any products are prescription-only or otherwise regulated.
2. Applicable licensing, sale, advertising, privacy, labelling, and product-claim requirements for each market.
3. Shipping providers, serviceable regions, tax/GST rules, invoices, returns, cancellations, and refunds.
4. Whether guest checkout is allowed.
5. Whether `.com` displays the full catalog or only selected products.
6. Which product/content fields are shared versus site-specific.
7. Admin staff, roles, approval workflow, and audit retention.
8. Hosting, storage, backups, monitoring, and recovery targets.
9. Email sender/domain verification and Google OAuth configuration.
10. Whether reviews, blog comments, multilingual content, and multiple currencies are in scope.
