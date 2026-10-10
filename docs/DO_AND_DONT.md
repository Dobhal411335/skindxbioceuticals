# Engineering Do / Don't Rules
## SkinDx Bioc platform

These rules apply to frontend, backend, admin, tests, and documentation. If a task conflicts with security or architecture requirements, stop and explain the conflict before implementing it.

## DO

### Architecture and TypeScript
- DO use TypeScript strict mode.
- DO organize backend code by business feature.
- DO keep controllers focused on HTTP concerns and services focused on business rules.
- DO use PostgreSQL + Prisma for persistent relational data.
- DO use Zod for external input and environment validation.
- DO keep the `.in` and `.com` frontends independent while sharing the backend.
- DO model site scope explicitly and enforce it server-side.
- DO centralize Axios configuration in each frontend.
- DO use clear, typed API contracts and consistent error handling.
- DO write tests for permissions, payments, and cross-site isolation.

### UI and design
- DO use **shadcn/ui** for accessible component primitives.
- DO use **Lucide React** for icons.
- DO use the design tokens in `DESIGN.md`.
- DO build responsive layouts and test mobile, tablet, and desktop.
- DO include loading, empty, disabled, success, and error states.
- DO use semantic HTML, keyboard support, visible focus, and accessible labels.
- DO use authentic, approved company/product assets and accurate alt text.
- DO keep product information and approved warnings legible.
- DO prefer reusable components where they have a real use across pages.

### Integrations
- DO use **Cloudinary** for managed image/media uploads and delivery.
- DO use **Brevo** for configured transactional email.
- DO use **Razorpay** for payments on `.in`.
- DO use a supported Google OAuth/OIDC flow for Google sign-in.
- DO keep provider calls inside server-side integration modules.
- DO use signed/restricted upload flows, server-side payment verification, and verified webhooks.
- DO document required environment variables in `.env.example` with placeholders only.

### Data and operations
- DO use database migrations and commit migration files.
- DO store money as integer minor units and currency.
- DO use transactions for operations that must succeed or fail together.
- DO paginate potentially large lists.
- DO log important admin changes without logging secrets or unnecessary personal data.
- DO ask for clarification when product regulation, shipping, tax, refunds, or business rules are unknown.

### Logging
- DO use the centralized backend logger (`backend/src/lib/logger`) for application events and errors.
- DO use each frontend’s centralized logger (`src/lib/logger`) and Axios interceptors for client HTTP logging.
- DO use structured event names (for example `auth.login.failure`, `media.upload.failure`) and include a validated `requestId` when available.
- DO choose the correct severity (`debug` / `info` / `warn` / `error` / `fatal`) and avoid duplicate logs of the same failure across layers.
- DO keep health-check and routine success noise out of production info-level logs.

## DON'T

### Security and data
- DON'T commit API keys, OAuth secrets, database passwords, JWT secrets, or `.env` files.
- DON'T expose Cloudinary, Brevo, Razorpay secret keys, or database credentials to the browser.
- DON'T trust frontend prices, totals, roles, site identifiers, or payment status.
- DON'T mark an order paid solely because the browser says payment succeeded.
- DON'T skip Razorpay signature verification or webhook idempotency.
- DON'T authorize admin access only in the UI.
- DON'T allow an admin to edit both sites unless their permissions allow it.
- DON'T return one customer's private records to another customer.
- DON'T store passwords in plaintext or long-lived sensitive tokens in localStorage.
- DON'T log passwords, access tokens, payment secrets, OTPs, or full sensitive payloads.
- DON'T introduce scattered `console.log()` / `console.error()` calls in application code when the centralized logger applies (CLI bootstraps and intentional test harness output may remain).
- DON'T log complete request/response bodies, Authorization headers, cookies, or Axios config objects.
- DON'T accept arbitrary file uploads or unrestricted upload credentials.

### Code quality
- DON'T use `any` as a shortcut; use a correct type or `unknown` with narrowing.
- DON'T put database queries in route definitions or controllers.
- DON'T create a giant global `utils.ts`, `services.ts`, or `types.ts` dumping ground.
- DON'T duplicate Axios instances or environment parsing without a reason.
- DON'T place all API responses in Redux by default.
- DON'T add a dependency without a concrete need.
- DON'T create empty placeholder layers/files just to satisfy a template.
- DON'T silence TypeScript, lint, or test errors without understanding them.
- DON'T make unrelated refactors while implementing a focused task.

### UI, content, and product claims
- DON'T use fake product data in production.
- DON'T fabricate reviews, ratings, discount percentages, scarcity timers, stock counts, certifications, clinical evidence, or testimonials.
- DON'T invent medical claims or state that a product cures/prevents/treats a condition unless the claim is approved and legally supportable.
- DON'T copy the reference website's brand assets or exact design; use its layout as inspiration.
- DON'T use emoji as a replacement for Lucide icons in production UI.
- DON'T use clickable-looking elements that do not perform an action.
- DON'T remove keyboard or screen-reader support when styling shadcn/ui components.
- DON'T hide important warnings, ingredients, or usage information in unreadable text.

## Required workflow for coding agents

Before coding:
1. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/SECURITY.md`, and this file.
2. Inspect the existing codebase and package manager before changing files.
3. State the intended files and approach for changes that affect architecture, authentication, payments, data models, or deployment.
4. Ask for clarification if a business rule or security decision is missing and cannot safely be inferred.

While coding:
1. Make the smallest coherent change.
2. Reuse established components, tokens, utilities, and patterns.
3. Validate inputs and enforce permissions on the server.
4. Keep secrets out of client code and logs.
5. Add or update tests for changed behavior.

After coding:
1. Run relevant lint, type-check, tests, and build commands when available.
2. Report exactly what ran and what passed or failed.
3. Identify migrations, environment variables, provider dashboard setup, and manual verification needed.
4. Do not claim a feature works if it is only scaffolded or mocked.
5. Summarize known gaps and security implications.

## Preferred libraries

| Concern | Preferred choice |
|---|---|
| Frontend framework | Next.js App Router |
| Language | TypeScript |
| Backend | Node.js + Express |
| Database / ORM | PostgreSQL + Prisma |
| Validation | Zod |
| Frontend HTTP client | Axios |
| Client state | Redux Toolkit only where appropriate |
| UI primitives | shadcn/ui |
| Icons | Lucide React |
| Image/media | Cloudinary |
| Transactional email | Brevo |
| Payments | Razorpay |
| Google login | OAuth 2.0 / OpenID Connect |
| Backend logging | Pino (+ `pino-pretty` in local development) |
| Frontend logging | Small typed `src/lib/logger` per Next.js app |
| Testing | Choose and standardize a test runner before adding many tests |

These are defaults, not permission to use an integration insecurely. Read the provider's current documentation when implementing provider-specific flows.
