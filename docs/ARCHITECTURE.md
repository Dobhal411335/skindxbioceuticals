# Architecture
## SkinDx Bioc multi-site platform

## 1. Architectural principles

- One backend and one PostgreSQL database initially; two independent Next.js storefronts.
- Feature-based backend organization.
- Explicit separation between HTTP handling, business logic, persistence, and integrations.
- Site-aware content and permissions from the beginning.
- Server-side enforcement for security-sensitive behavior.
- Prefer simple, testable modules over premature abstraction.
- Do not implement future features until their requirements are clear, but do not block the second site through hardcoded assumptions.

## 2. High-level topology

```text
.in Next.js storefront ─┐
                       ├── Node.js + TypeScript API ── PostgreSQL
.com Next.js website ───┘             │
                                      ├── Razorpay
                                      ├── Brevo
                                      └── Cloudinary

Admin UI (protected) ─────────────────┘
```

The admin can be deployed as a protected area of the `.in` application or as a separate application. Keep this as an explicit deployment decision; do not accidentally couple admin routes to public storefront rendering. Regardless of deployment, both site workspaces use the same authenticated API.

## 3. Repository layout

Recommended monorepo when the team wants shared types and tooling:

```text
skindx-platform/
├── apps/
│   ├── storefront-in/        # Next.js .in
│   ├── website-com/          # Next.js .com
│   ├── admin/                # Optional separate admin Next.js app
│   └── api/                  # Express + TypeScript
├── packages/
│   ├── shared-types/
│   ├── validation/           # Only genuinely shared schemas
│   └── config/               # Shared lint/TS config if useful
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── SECURITY.md
│   └── DO_AND_DONT.md
├── .cursor/
│   └── rules/
│       └── project.mdc
├── package.json
└── README.md
```

If the project is intentionally split into separate repositories, retain the same boundaries and copy/sync only the relevant rules. Do not create a monorepo solely for fashion; choose it if shared types, linting, and coordinated changes provide real value.

## 4. Backend feature structure

```text
apps/api/src/
├── app.ts
├── server.ts
├── config/
│   └── env.ts
├── lib/
│   ├── prisma.ts
│   ├── logger/                 # Pino structured logger, redaction, request ID middleware
│   └── integrations/
│       ├── razorpay.client.ts
│       ├── brevo.client.ts
│       └── cloudinary.client.ts
├── middleware/
│   ├── authenticate.ts
│   ├── authorize.ts
│   ├── validate.ts
│   ├── site-context.ts
│   ├── rate-limit.ts
│   └── error-handler.ts
├── routes/
│   └── v1.ts
├── features/
│   ├── auth/
│   ├── users/
│   ├── sites/
│   ├── products/
│   ├── categories/
│   ├── inventory/
│   ├── cart/
│   ├── coupons/
│   ├── orders/
│   ├── payments/
│   ├── shipping/
│   ├── enquiries/
│   ├── content/
│   ├── media/
│   ├── reviews/
│   ├── admin/
│   └── audit-logs/
├── shared/
│   ├── errors/
│   ├── http/
│   └── types/
└── tests/
```

A feature may contain `*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.schema.ts`, and `*.types.ts` where each file is justified. Do not create empty files for every layer by rote.

### Request flow

```text
Route → middleware → controller → service → repository → Prisma → PostgreSQL
```

- **Route:** URL, HTTP method, and middleware composition.
- **Middleware:** authentication, authorization, site context, validation, rate limiting, request logging.
- **Controller:** translate HTTP request/response; no business rules or direct database queries.
- **Service:** business rules and transaction coordination.
- **Repository:** database persistence/query logic through Prisma.
- **Integration client:** isolated provider API calls and signature verification helpers.
- **Schema:** validate untrusted request input with Zod.

Avoid unnecessary repository wrappers for trivial queries if they add no testability or separation. Keep consistency within each feature.

### Logging architecture

**Current repository layout** uses `backend/`, `frontend/` (`.in` storefront), and `admin/` (not the aspirational `apps/*` tree above). Apply the same logging pattern when a `.com` Next.js app is added.

**Backend (`backend/src/lib/logger/`):**
- Pino structured logger with service name `skindx-api` and environment bindings.
- Development: readable `pino-pretty` output. Test: quiet (`LOG_LEVEL=silent` by default). Production: JSON to stdout.
- `requestLoggerMiddleware` validates/generates `X-Request-Id`, measures duration, and logs each completed HTTP request once (health checks at debug).
- Error middleware logs unexpected failures once with stack + `requestId`; expected `AppError` / validation failures are not treated as unexpected server errors.
- Business/integration code logs named lifecycle events (auth, email, media failures) without secrets or full payloads.

**Frontend (`frontend/src/lib/logger/`, `admin/src/lib/logger/`):**
- Small typed console logger; production suppresses `debug` by default.
- Axios interceptors on the centralized client attach `X-Request-Id`, measure duration, and log safe success/failure metadata (no bodies, tokens, or Authorization headers).
- Refresh-token retries must not produce duplicate failure logs; cancelled requests are not unexpected errors.

**Correlation:** Frontend forwards `X-Request-Id`; backend validates or replaces it, returns it on the response, and includes it in request/error logs and error JSON when available.

## 5. Frontend structure

```text
src/
├── app/
├── components/
│   ├── layout/
│   ├── shared/
│   └── ui/
├── features/
│   ├── auth/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── ...
├── services/
│   └── api/
├── store/
├── hooks/
├── lib/
├── types/
└── config/
```

- Use App Router layouts and server components by default.
- Add `"use client"` only where browser interactivity is required.
- Keep Axios configuration centralized and attach logging/correlation through interceptors only.
- Keep the frontend logger under `src/lib/logger` (never import the backend Pino logger into browser bundles).
- Use Redux Toolkit for client-owned state such as cart UI state or session-related UI state when needed.
- Consider TanStack Query for remote/server data caching; do not mirror every API response in Redux.
- Keep feature-specific API functions, types, and UI near the feature when practical.

## 6. Multi-site model

Use a first-class site concept, not scattered hostname string checks.

Suggested conceptual entities:
- `Site`: stable code (`IN`, `COM`), canonical domain, active status, site settings.
- `Page` / `ContentEntry`: site scope, slug, status, SEO fields, content blocks.
- `NavigationItem`, `Banner`, `SiteSetting`: site scope.
- `Product`: core product identity and product attributes.
- `SiteProduct` or equivalent: per-site visibility, merchandising, optional site-specific copy/price policy.
- `Category`: site scope if category trees differ; otherwise explicit shared association.
- `User`, `Role`, `Permission`, `RoleAssignment`.
- `Enquiry`: originating site, status, contact data, timestamps.
- `Order`, `OrderItem`, `PaymentAttempt`, `InventoryMovement`.
- `MediaAsset`: provider asset ID, URL, dimensions/type, alt text, ownership metadata.
- `AuditLog`: actor, action, target, timestamp, safe metadata.

This is a conceptual starting point, not a final Prisma schema. Confirm pricing, stock, product sharing, tax, and fulfilment rules before locking migrations.

## 7. API conventions

- Prefix routes with `/api/v1`.
- Use resource-oriented routes and correct HTTP methods.
- Validate params, query strings, and bodies with Zod.
- Use a consistent success/error envelope and stable machine-readable error codes.
- Never expose stack traces, SQL, secrets, provider credentials, or sensitive customer fields.
- Use pagination for growing collections.
- Enforce authorization and site scope on every relevant backend operation.
- Use idempotency for payment/webhook/order operations where appropriate.
- Keep API documentation current (OpenAPI is recommended once routes stabilize).

## 8. Data and transactions

- PostgreSQL is the source of truth for orders, payments, inventory, users, and content.
- Use Prisma migrations committed to version control.
- Use database transactions for multi-step changes such as order creation and inventory reservation.
- Store money as integer minor units (e.g. paise) plus currency, not floating-point values.
- Preserve an order-item snapshot of relevant product name, SKU, price, quantity, and tax/discount details at purchase time.
- Do not assume a payment capture and an order status update are the same operation.
- Make webhook handling idempotent and resilient to retries or out-of-order delivery.
- Define stock reservation, expiry, cancellation, refund, and reconciliation rules before production.

## 9. Environments and deployment

- Separate local, test, staging, and production configuration.
- Validate required environment variables at startup.
- Use managed secrets in deployed environments.
- Apply migrations deliberately during deployment; do not auto-reset or destructively migrate production.
- Configure backups, restore tests, health checks, structured logs (`LOG_LEVEL`), error monitoring, and uptime alerts.
- Configure CORS with explicit allowed origins; do not use wildcard origins with credentialed requests.
- Use HTTPS everywhere outside local development.

## 10. Testing strategy

- Unit tests for business rules and validation.
- Integration tests for database-backed services and permissions.
- API tests for auth, site isolation, enquiries, orders, and admin endpoints.
- Payment tests using provider test mode and verified webhook fixtures.
- End-to-end tests for signup/login, cart/checkout, payment confirmation, and admin site switching.
- Regression tests for cross-site data leakage and role escalation.
