-- CreateTable
CREATE TABLE "customer_reviews" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "customer_name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_reviews_site_id_order_idx" ON "customer_reviews"("site_id", "order");

-- CreateIndex
CREATE INDEX "customer_reviews_site_id_active_order_idx" ON "customer_reviews"("site_id", "active", "order");

-- AddForeignKey
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
