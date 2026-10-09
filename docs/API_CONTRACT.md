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
| `/admin/users` | staff accounts and roles | Highly restricted admin |
| `/admin/audit-logs` | review administrative changes | Authorized admin |

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
