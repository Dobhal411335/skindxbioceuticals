# Testing Strategy
## SkinDx Bioc platform

**Required default:** Every new backend route and every new/changed data model must include relevant automated tests in the same change. Do not postpone tests until the end of the project.

## 1. Testing goals

- Catch regressions while features are small.
- Verify business rules, input validation, permissions, and data integrity.
- Prevent customer data leakage across users and sites.
- Verify payment and webhook behavior without real money movement.
- Keep tests repeatable, isolated, and safe for local/CI execution.

## 2. Test levels

### Unit tests — Jest
Use Jest for fast tests of isolated business logic:
- Service functions and business rules.
- Zod schemas and validation helpers.
- Price/discount/eligibility calculations.
- Permission and site-access decision functions.
- Utility functions and state transitions.
- Integration-client wrappers where provider behavior can be mocked safely.

Unit tests should not require a live production service or network access.

### API/integration tests — Jest + Supertest
For every new route, test the HTTP behavior with Supertest:
- Expected success status and response schema.
- Invalid params/query/body.
- Unauthenticated requests.
- Forbidden roles/site scopes.
- Not-found and conflict cases.
- Relevant database changes and side effects.
- Rate-limit behavior for sensitive endpoints where practical.

Prefer a dedicated disposable PostgreSQL test database for repository and API integration tests. Mock external providers, not the database behavior that the test is intended to verify.

### Frontend tests
For interactive frontend components and client-side logic, use Jest with React Testing Library if Jest is the chosen frontend runner. Test user-visible behavior, form validation, loading/error states, and important interactions. Next.js server components and end-to-end flows may need additional tools or test approaches; do not assume Jest alone covers the entire app.

### End-to-end tests
Add browser-level tests for critical journeys once the UI is implemented:
- Customer signup/login and Google sign-in flow boundaries.
- Product browsing and cart operations.
- Checkout and payment test mode.
- Order confirmation/history.
- Admin site switching and permission boundaries.
- `.com` enquiry submission and admin handling.

A browser E2E runner such as Playwright can complement Jest; it does not replace unit/API tests.

## 3. Jest setup

Choose and standardize the TypeScript transform for each app. For the Express TypeScript backend, use Jest with a supported TypeScript transform such as `ts-jest` or `@swc/jest`; do not configure multiple transforms without a reason.

Typical backend development dependencies:
- `jest`
- `ts-jest` or `@swc/jest`
- `@types/jest`
- `supertest`
- `@types/supertest`
- A test database setup appropriate for Prisma/PostgreSQL

Use versions compatible with the selected Node.js, TypeScript, and Jest versions. Pin versions through the chosen package manager lockfile.

Suggested layout:

```text
apps/api/
├── src/
│   └── features/
│       └── products/
│           ├── product.routes.ts
│           ├── product.controller.ts
│           ├── product.service.ts
│           ├── product.repository.ts
│           ├── product.schema.ts
│           └── product.service.test.ts
├── tests/
│   ├── integration/
│   │   ├── products.routes.test.ts
│   │   ├── auth.routes.test.ts
│   │   └── site-isolation.test.ts
│   ├── fixtures/
│   └── setup/
├── jest.config.ts
└── package.json
```

Keep unit tests near the feature when that helps discovery. Put cross-feature/API integration tests under `tests/integration`. Use one naming convention consistently, such as `*.test.ts`.

## 4. Required rule: tests with every route and model

### When adding a route
Do not consider a route complete until relevant tests are added for:
- Successful behavior.
- Request validation failure.
- Authentication/authorization failure.
- Site scope/ownership rules.
- Not-found/conflict cases where applicable.
- Expected database changes.
- Important failure paths and external-service errors.

Use Supertest against the Express app without opening a real listening port when possible. Export/configure the app separately from `server.ts` so tests can import it safely.

### When adding or changing a data model
Prisma model declarations do not usually need a one-to-one “model unit test.” Test the behavior and integrity the model enables:
- Repository/service create/read/update/delete behavior where applicable.
- Required fields, uniqueness, foreign keys, and important constraints.
- Relations and cascade/restrict behavior where configured.
- Site-scope query behavior.
- Migration application against a disposable PostgreSQL test database.
- Domain rules that depend on the model.

Use actual PostgreSQL integration tests for database constraints. Mocked Prisma tests alone cannot prove that a migration or database constraint works.

### Definition of done
A route, model-backed feature, or behavior change is not done until its tests are written, run, and reviewed. If a test cannot be run due to missing infrastructure, state that explicitly; do not report it as passing.

## 5. Critical test scenarios

### Authentication
- Invalid credentials are rejected.
- Passwords are never returned.
- Rate limiting is applied where configured.
- Expired/revoked sessions are rejected.
- Invalid Google token claims are rejected.
- Account linking requires verified identity.

### Authorization and site isolation
- Guest cannot call customer-only endpoints.
- Customer A cannot access Customer B's orders, addresses, cart, or profile.
- Customer cannot access admin routes.
- Admin without permission cannot perform restricted operations.
- `.in`-only admin cannot edit `.com` content and vice versa unless granted access.
- A forged site identifier cannot bypass server-side site resolution.

### Ecommerce and payments
- Totals are calculated server-side.
- Invalid/expired coupons are rejected.
- Inventory rules hold under concurrent or repeated requests.
- Browser-supplied payment success does not mark an order paid.
- Invalid Razorpay checkout signatures are rejected.
- Invalid webhook signatures are rejected.
- Duplicate webhook events do not double-fulfil an order or double-adjust stock.
- Wrong amount, currency, order reference, or payment reference is rejected.
- Failed/cancelled payments follow the documented state machine.

### Enquiries, media, email
- Invalid enquiry input is rejected and abuse controls apply.
- Unauthorized users cannot read or delete enquiries.
- Uploads enforce file size/type/permission limits.
- Provider credentials never appear in API responses or logs.
- Email-provider failure does not corrupt the primary database transaction.

## 6. Test data and isolation

- Use a dedicated test database, never production.
- Never run tests that delete/reset an unspecified database.
- Ensure test data is cleaned up or isolated between tests.
- Avoid shared mutable fixtures that make tests order-dependent.
- Use deterministic factories/builders with clearly fake data.
- Mock Razorpay, Brevo, Google, and Cloudinary at the integration boundary for unit tests.
- Use provider test mode and safe fixtures for provider-specific verification.
- Never use real customer data or real payment credentials in tests.

## 7. Suggested scripts

Adapt these to the package manager and monorepo setup:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --selectProjects unit",
    "test:integration": "jest --selectProjects integration",
    "typecheck": "tsc --noEmit"
  }
}
```

If Jest projects are not configured, do not add `--selectProjects` scripts until the configuration exists. Use scripts that actually work in the repository.

## 8. Coverage policy

- Start with coverage reporting and meaningful assertions, not a vanity percentage.
- Set thresholds once the baseline exists; increase them as coverage grows.
- Require strong coverage for authorization, payment calculations, signature verification, webhook idempotency, and site isolation.
- Do not test implementation details when observable behavior is the actual contract.
- Do not write tests that simply mirror code or mock away the behavior they claim to verify.

## 9. Pull request / coding-agent checklist

- [ ] Tests added in the same change as every new route or model-backed feature.
- [ ] Unit tests cover business rules.
- [ ] API tests cover status codes, schemas, authentication, permissions, and site scope.
- [ ] PostgreSQL integration tests cover important data constraints.
- [ ] External services are mocked in unit tests.
- [ ] Relevant tests, lint, type-check, and build have actually been run.
- [ ] Failures and skipped checks are reported honestly.
- [ ] No test connects to production or uses real payment credentials.
