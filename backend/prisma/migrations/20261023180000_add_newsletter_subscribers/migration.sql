-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribe_token" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "newsletter_subscribers_site_id_is_active_idx" ON "newsletter_subscribers"("site_id", "is_active");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_unsubscribe_token_idx" ON "newsletter_subscribers"("unsubscribe_token");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_site_id_email_key" ON "newsletter_subscribers"("site_id", "email");

-- AddForeignKey
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
