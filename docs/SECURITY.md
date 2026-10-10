# Security Requirements
## SkinDx Bioc platform

This document is a technical baseline, not legal advice or a substitute for a product-specific security/compliance review.

## 1. Security principles

- Deny by default and grant least privilege.
- Treat every browser request, header, query parameter, file, webhook, and third-party callback as untrusted.
- Enforce security on the backend; frontend route guards are user experience, not authorization.
- Keep secrets server-side and use separate credentials per environment.
- Minimize collection and retention of personal data.
- Log security-relevant events without logging passwords, tokens, payment secrets, or unnecessary personal data.

## 2. Authentication

Support email/password authentication and Google sign-in/sign-up.

### Email/password
- Validate and normalize email addresses.
- Hash passwords using a well-maintained password hashing algorithm such as Argon2id (or an appropriately configured bcrypt implementation if required by the stack). This project uses bcryptjs with 12 salt rounds for password hashes.
- Strong password policy for customer registration: minimum 12 characters with upper, lower, digit, and special character.
- Never store or log plaintext passwords or OTPs.
- Use generic login/reset responses where needed to reduce account enumeration. Unverified password accounts that present a valid password receive `403` with `EMAIL_NOT_VERIFIED` so the client can continue verification without issuing a full session.
- Rate-limit login, signup, password reset, verification, and sensitive account actions.
- Email verification uses cryptographically random numeric OTPs (default length 6, expiry 10 minutes, max 5 attempts, 60s resend cooldown). Store only a hash; consume atomically; invalidate prior unconsumed OTPs on resend.
- Do not silently link Google and password accounts on email match alone.
- Revoke sessions/refresh tokens on logout, password reset, and relevant security events. Refresh-token reuse after rotation revokes the user's refresh-token family.

### Google sign-in
- Use a supported OAuth 2.0 / OpenID Connect library and the correct authorization-code flow for the chosen application architecture.
- Validate ID tokens server-side: signature, issuer, audience, expiry, and nonce/state as appropriate.
- Use exact registered redirect URIs; do not accept arbitrary callback URLs.
- Do not trust a client-supplied email or Google user ID without provider-token verification.
- Link Google and password accounts only through a safe, verified account-linking process.
- Do not request Google scopes the application does not need.

### Session/token handling
- Prefer secure, HttpOnly, SameSite cookies for browser sessions/refresh credentials where compatible with the deployment architecture.
- Set `Secure` in HTTPS environments and use an appropriate cookie path/domain policy.
- Protect cookie-authenticated state-changing endpoints against CSRF. Cookie-driven `/auth/refresh` and `/auth/logout` enforce an Origin/Referer allowlist against `CORS_ORIGINS`.
- Access tokens are short-lived JWTs returned in JSON and sent as Bearer headers; refresh tokens are HttpOnly cookies for storefront clients (JSON body for admin). Do not put signing secrets or refresh credentials in `NEXT_PUBLIC_` variables or `localStorage`.
- Rotate refresh tokens on each successful refresh; detect reuse of revoked tokens and revoke the user's remaining refresh tokens.

## 3. Authorization and admin security

- Implement server-side RBAC/permissions for every admin endpoint.
- Enforce site scope (`IN`, `COM`) on every content and admin operation.
- Do not rely on hidden buttons or frontend role checks.
- Prevent horizontal privilege escalation (accessing another customer's records) and vertical escalation (ordinary user becoming admin).
- Require strong authentication for admin users; consider MFA before production.
- Restrict role changes, admin invitations, exports, refunds, payment adjustments, and site settings to explicit permissions.
- Record audit events for sensitive admin actions, including actor, action, target, timestamp, and safe metadata.
- Never expose admin APIs publicly without authentication and authorization.

## 4. Site and data isolation

- Resolve the target site from trusted server configuration/validated host mapping, not arbitrary client input alone.
- Verify that the authenticated admin is allowed to manage the resolved site.
- Include site scope in database queries where relevant and test cross-site access explicitly.
- Use separate permission checks for shared products versus site-specific content.
- Prevent `.com` enquiry users from accessing `.in` customer/order data.
- Avoid leaking personal information in URLs, analytics, error messages, or logs.

## 5. API and application security

- Validate all request bodies, params, and query strings using Zod or equivalent schemas.
- Use parameterized ORM queries; never construct raw SQL from untrusted input.
- Configure explicit CORS origins for deployed domains. Do not combine wildcard origins with credentials.
- Apply rate limits to authentication, enquiry forms, search, checkout, and other abuse-prone endpoints.
- Set appropriate security headers, request size limits, and timeouts.
- Use CSRF protection when cookie-based authentication is used.
- Prevent XSS by escaping/rendering content safely; sanitize rich HTML if rich text is allowed.
- Avoid open redirects, SSRF, path traversal, mass assignment, and unsafe deserialization.
- Return generic production errors; keep stack traces in protected server logs.
- Keep dependencies updated and scan for known vulnerabilities.

## 6. Razorpay and payment security

- Create Razorpay orders from the backend using server-calculated amounts and currency.
- Never accept the final payable amount, discount, tax, or order total as authoritative from the browser.
- Verify the Razorpay checkout signature on the backend using the documented algorithm and secret.
- Verify webhook signatures using the raw request body as required by the provider's documentation.
- Make webhook processing idempotent and tolerate retries.
- Validate that payment/order IDs correspond to the expected local order, amount, and currency.
- Do not mark an order paid based only on a success redirect or frontend callback.
- Store only necessary provider references and payment status; never store card numbers, CVVs, or payment credentials.
- Keep Razorpay keys/secrets in server-side environment configuration; expose only explicitly public identifiers where required.
- Define refund, cancellation, reconciliation, and failed-payment flows before production.

## 7. Cloudinary/media security

- Do not expose Cloudinary API secrets or unrestricted upload credentials in browser code.
- Use backend-signed uploads or a tightly restricted upload preset with size, format, and folder constraints.
- Validate allowed file types using actual content/type checks, not only the filename extension.
- Limit file size and dimensions; reject unexpected formats.
- Restrict who can upload, replace, or delete assets.
- Avoid allowing user uploads to execute as active content.
- Keep ownership and asset references in the database and prevent unauthorized asset replacement/deletion.

## 8. Brevo/email security

- Keep Brevo API keys server-side.
- Use verified sender identities and domain authentication where configured.
- Avoid including sensitive account/payment details in emails.
- Escape user-provided content in templates and prevent header injection.
- Rate-limit enquiry and email-triggering endpoints to prevent abuse.
- Avoid sending marketing email without appropriate consent and unsubscribe handling where required.
- Do not expose provider error payloads or API keys to users.

## 9. Personal data and pharmaceutical content

- Collect only information needed for the business purpose.
- Do not request health/medical information unless it is necessary, approved, and handled with appropriate safeguards.
- Do not build diagnostic or prescription recommendations as a casual ecommerce feature.
- Confirm applicable privacy, consumer, advertising, labelling, pharmacy, and product-sale requirements with qualified counsel/business owners.
- Use approved product descriptions, ingredient/specification details, directions, warnings, and claims.
- Do not invent treatment claims, clinical evidence, certifications, approvals, or safety guarantees.
- Define data retention, deletion, access requests, backups, and incident response processes.

## 10. Environment and infrastructure

- Validate environment variables at startup with Zod.
- Commit `.env.example` with placeholder names only; never commit real secrets.
- Use different credentials for local, staging, and production.
- Use HTTPS in deployed environments.
- Restrict database network access and use least-privilege database credentials.
- Keep production database backups encrypted and test restoration.
- Use structured logging, monitoring, alerting, and a documented incident-response process.
- Redact sensitive fields in logs and error monitoring.
- Apply database migrations deliberately; prohibit destructive reset commands against production.

### Logging and redaction

- Backend logging uses Pino with a shared redaction policy (`backend/src/lib/logger`). Frontends use a small typed logger plus Axios interceptors with the same field categories.
- Always omit or redact: passwords, OTPs/verification codes, access/refresh tokens, Authorization/cookie headers, API keys/client secrets, bootstrap secrets, and sensitive payment/identity fields.
- Prefer logging events and safe metadata over arbitrary request/response payloads. Sanitize URLs/query strings that may contain credentials.
- Unexpected server errors may include stack traces in protected server logs only; production clients receive generic messages plus a correlation `requestId` / `X-Request-Id` when available.
- Never log `.env` contents. Do not expose private logging configuration through unnecessary `NEXT_PUBLIC_` variables.
- Production frontend logs suppress verbose debug output by default.

## 11. Required security tests before launch

- Customer cannot read another customer's profile, address, cart, or order.
- Customer cannot access admin routes.
- Admin cannot manage a site outside their permission.
- `.com` content/enquiry APIs cannot leak `.in` customer/order data.
- Tampered amount, currency, coupon, product price, or order ID is rejected.
- Invalid/replayed Razorpay webhook cannot change order state incorrectly.
- Invalid Google token, audience, issuer, state, or redirect is rejected.
- Upload restrictions and authorization are enforced.
- Login/reset/enquiry endpoints are rate-limited.
- Sensitive values are absent from client bundles, logs, and error responses.
