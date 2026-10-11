-- CreateEnum
CREATE TYPE "SocialPostType" AS ENUM ('INSTAGRAM', 'FACEBOOK');

-- CreateTable
CREATE TABLE "social_posts" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "post_type" "SocialPostType" NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "post_url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_posts_site_id_order_idx" ON "social_posts"("site_id", "order");

-- CreateIndex
CREATE INDEX "social_posts_site_id_post_type_order_idx" ON "social_posts"("site_id", "post_type", "order");

-- CreateIndex
CREATE INDEX "social_posts_site_id_active_order_idx" ON "social_posts"("site_id", "active", "order");

-- AddForeignKey
ALTER TABLE "social_posts" ADD CONSTRAINT "social_posts_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
