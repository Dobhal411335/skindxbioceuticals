# Backend API

Feature-based Node.js / TypeScript / Express API for the Skindx Bioceuticals platform.

This single backend is designed to serve both:

- the **.in** ecommerce storefront
- the **.com** enquiry / content website

Business logic, payment gateways, and email/SMS integrations are intentionally **not** implemented yet. This repository layer establishes architecture, configuration, middleware, Prisma models, and feature module scaffolding.

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 20+ |
| Language | TypeScript (strict) |
| HTTP | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Validation | Zod |
| Auth | JWT (access + refresh) |
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
| `npm run prisma:migrate` | Create / apply migrations |
| `npm run prisma:studio` | Prisma Studio |

## API versioning

All feature routes mount under `/api/v1`:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/products`
- `/api/v1/categories`
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

## Directory responsibilities

| Path | Role |
| --- | --- |
| `src/app.ts` | Express app factory (middleware, routes, error handlers) |
| `src/server.ts` | Process bootstrap, DB connect, graceful shutdown |
| `src/config/` | Validated env + app/database config |
| `src/middlewares/` | Auth, validation, 404, global errors |
| `src/routes/` | API v1 route registration |
| `src/lib/` | Shared infra (Prisma client, JWT, password hashing) |
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
