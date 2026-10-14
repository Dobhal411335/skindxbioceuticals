-- Guest checkout + Razorpay payment fields (safe for existing orders).

-- 1) Orders: nullable user, durable contact email, confirmation email flag
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contact_email" TEXT;
UPDATE "orders" o
SET "contact_email" = lower(u."email")
FROM "users" u
WHERE o."user_id" = u."id" AND (o."contact_email" IS NULL OR o."contact_email" = '');

-- Any remaining rows without a user email (should be none) get a placeholder that fails validation in app code.
UPDATE "orders" SET "contact_email" = 'unknown@invalid.local' WHERE "contact_email" IS NULL OR "contact_email" = '';

ALTER TABLE "orders" ALTER COLUMN "contact_email" SET NOT NULL;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "confirmation_email_sent_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "orders_contact_email_idx" ON "orders"("contact_email");

-- 2) Payments: Razorpay + idempotency
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "amount_in_paise" INTEGER NOT NULL DEFAULT 0;
UPDATE "payments"
SET "amount_in_paise" = ROUND(("amount"::numeric) * 100)::integer
WHERE "amount_in_paise" = 0 AND "amount" IS NOT NULL;

ALTER TABLE "payments" ALTER COLUMN "method" SET DEFAULT 'OTHER';

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider_order_id" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "idempotency_scope" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "request_hash" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "failure_code" TEXT;

-- Normalize provider default
UPDATE "payments" SET "provider" = 'razorpay' WHERE "provider" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'razorpay';
ALTER TABLE "payments" ALTER COLUMN "provider" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_order_id_key" ON "payments"("provider_order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_provider_payment_id_key" ON "payments"("provider_payment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotency_scope_idempotency_key_key"
  ON "payments"("idempotency_scope", "idempotency_key");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");

-- 3) Guest checkout sessions
CREATE TABLE IF NOT EXISTS "guest_checkout_sessions" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMP(3),
    "otp_hash" TEXT,
    "otp_expires_at" TIMESTAMP(3),
    "otp_attempt_count" INTEGER NOT NULL DEFAULT 0,
    "otp_consumed_at" TIMESTAMP(3),
    "otp_last_sent_at" TIMESTAMP(3),
    "shipping_address" JSONB,
    "notes" TEXT,
    "order_id" UUID,
    "confirmation_token_hash" TEXT,
    "confirmation_token_expires_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_checkout_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "guest_checkout_sessions_token_hash_key" ON "guest_checkout_sessions"("token_hash");
CREATE UNIQUE INDEX IF NOT EXISTS "guest_checkout_sessions_order_id_key" ON "guest_checkout_sessions"("order_id");
CREATE INDEX IF NOT EXISTS "guest_checkout_sessions_email_idx" ON "guest_checkout_sessions"("email");
CREATE INDEX IF NOT EXISTS "guest_checkout_sessions_expires_at_idx" ON "guest_checkout_sessions"("expires_at");
CREATE INDEX IF NOT EXISTS "guest_checkout_sessions_confirmation_token_hash_idx" ON "guest_checkout_sessions"("confirmation_token_hash");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'guest_checkout_sessions_order_id_fkey'
  ) THEN
    ALTER TABLE "guest_checkout_sessions"
      ADD CONSTRAINT "guest_checkout_sessions_order_id_fkey"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) Webhook event dedupe
CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_provider_event_id_key"
  ON "webhook_events"("provider", "provider_event_id");
CREATE INDEX IF NOT EXISTS "webhook_events_event_type_idx" ON "webhook_events"("event_type");
