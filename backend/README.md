# Backend API

Feature-based Node.js / TypeScript / Express API for the Skindx Bioceuticals platform.

This single backend is designed to serve both:

- the **.in** ecommerce storefront
- the **.com** enquiry / content website

Customer **Google authentication** is implemented (`POST /api/v1/auth/google` with server-side ID token verification). Email/password customer auth, orders, and payments remain largely scaffolded. Transactional email infrastructure via **Brevo** is implemented under `src/lib/email/` (welcome email is sent on first Google signup). Full Google setup: [`docs/GOOGLE_AUTH.md`](../docs/GOOGLE_AUTH.md).

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 20+ |
| Language | TypeScript (strict) |
| HTTP | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Auth | JWT (access + refresh); Google ID token verification (`google-auth-library`) |
| Lint / format | ESLint + Prettier |

## Architecture

Dependency flow:

```
Route → Middleware → Controller → Service → Repository → Prisma → PostgreSQL
```

| Layer | Responsibility |
| --- | --- |
| **Routes** | Path wiring + middleware only |
| **Controllers** | HTTP (`req` / `res` / status codes) |
| **Services** | Business logic |
| **Repositories** | Database access via Prisma |
| **Validation** | Zod schemas per feature |

Features live under `src/features/<feature>/` and stay independently organized.

## Getting started

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL URL and JWT secrets (min 32 chars)

npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Health check: `GET http://localhost:5000/health`  
API prefix: `/api/v1` (configurable via `API_PREFIX`)

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript + resolve path aliases |
| `npm start` | Run compiled `dist/server.js` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Ensure test DB + run Jest (unit + integration) |
| `npm run prisma:migrate` | Create / apply migrations |
| `npm run prisma:studio` | Prisma Studio |

## API versioning

All feature routes mount under `/api/v1`:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/products`
- `/api/v1/category`
- `/api/v1/cart`
- `/api/v1/wishlist`
- `/api/v1/orders`
- `/api/v1/payments`
- `/api/v1/coupons`
- `/api/v1/reviews`
- `/api/v1/inventory`
- `/api/v1/blog`
- `/api/v1/enquiries`
- `/api/v1/admin`
- `/api/v1/media`
- `/api/v1/settings`
- `/api/v1/shipping`

Each feature currently exposes a scaffold `GET .../status` handler only.

## Environment

See `.env.example`. Required values are validated at startup with Zod (`src/config/env.ts`).

`CORS_ORIGINS` accepts a comma-separated list so both frontends can call the same API.

### Brevo transactional email

Configure these **server-only** variables (never expose them to any frontend):

| Variable | Required | Purpose |
| --- | --- | --- |
| `BREVO_API_KEY` | yes | Brevo API key |
| `BREVO_SENDER_EMAIL` | yes | Verified sender address |
| `BREVO_SENDER_NAME` | yes | Sender display name |
| `BREVO_REPLY_TO` | no | Optional reply-to address |
| `COMPANY_NAME` | no (default `SkinDx Bioc`) | Company name in templates |
| `COMPANY_LOGO_URL` | no | Logo URL when available |
| `SUPPORT_EMAIL` | yes | Support contact in footers |
| `SITE_IN_URL` | yes | Canonical `.in` site URL |
| `SITE_COM_URL` | yes | Canonical `.com` site URL |
| `PRIVACY_POLICY_URL` | no | Privacy link in footers |

**Sender / domain setup**

1. Create a Brevo account and generate an API key with transactional email permission.
2. Add and verify the sender email (and authenticate the sending domain in Brevo when deploying).
3. Put the values above into `backend/.env` (local) or your host’s secret store (production).
4. Restart the API so Zod re-validates env at startup.

**Important:** A successful API response means Brevo **accepted** the message for sending. It does **not** guarantee inbox delivery.

### Email module

Shared service: `src/lib/email/`

| Area | Path |
| --- | --- |
| Service API | `email.service.ts` |
| Brevo HTTP client | `email.client.ts` |
| Company / site brand | `company/` |
| Layout (header/footer) | `layouts/` |
| Templates | `templates/` |
| Unit tests | `tests/` (under `src/lib/email/tests`) |

**Implemented templates**

- Authentication: OTP, welcome, email verification, password reset, password changed
- Ecommerce: order confirmation, payment success/failed, order status, shipped, delivered, cancelled, refund status
- Enquiries: enquiry confirmation

**Feature-layer integration status**

Customer auth, orders, payments, and enquiries are still scaffolded, so templates are **not yet wired** into live business workflows. When those services are implemented, call `emailService` **after** the relevant DB transaction commits. Provider failures return `{ submitted: false, ... }` and must not roll back completed payments/orders.

Recommended reliability pattern for production: transactional **outbox / queue** with retries and delivery event tracking, rather than unreliable fire-and-forget calls inside request handlers.

**Manual variables you must configure**

Set real values in your local `backend/.env` (this file is not overwritten by the repo):

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `SUPPORT_EMAIL`
- `SITE_IN_URL`
- `SITE_COM_URL`
- Optionally: `BREVO_REPLY_TO`, `COMPANY_LOGO_URL`, `PRIVACY_POLICY_URL`

Do not claim end-to-end email delivery works until those are configured and a safe smoke test is run against a test recipient.

### Running email unit tests

```bash
cd backend
npx jest --runInBand --testPathPatterns=src/lib/email/tests
```

Unit tests cover validation, site branding, template rendering (HTML + text, escaping), and the Brevo client/service with a mocked `fetch`. They never call the real Brevo API.

Do not claim real inbox delivery works until Brevo sender/domain verification is complete and a safe end-to-end smoke test has been run against a test recipient.

## Directory responsibilities

| Path | Role |
| --- | --- |
| `src/app.ts` | Express app factory (middleware, routes, error handlers) |
| `src/server.ts` | Process bootstrap, DB connect, graceful shutdown |
| `src/config/` | Validated env + app/database config |
| `src/middlewares/` | Auth, validation, 404, global errors |
| `src/routes/` | API v1 route registration |
| `src/lib/` | Shared infra (Prisma client, JWT, password hashing, Brevo email) |
| `src/utils/` | Cross-cutting helpers (API responses, asyncHandler, AppError, pagination) |
| `src/types/` | Shared TS types + Express augmentation |
| `src/features/` | Feature modules (controller/service/repository/routes/validation/types) |
| `prisma/` | Prisma schema and migrations |

## Conventions

1. Controllers never call Prisma.
2. Services never touch `Request` / `Response`.
3. Repositories own all database access.
4. Prefer Zod for input validation via `validate` middleware.
5. Avoid `any`; keep TypeScript strict.
6. Do not hard-code frontend-specific assumptions into the API shape.
