-- Replace unused global blog_posts scaffold with site-scoped blogs.

ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_cover_media_id_fkey";

DROP TABLE IF EXISTS "blog_posts";

DROP TYPE IF EXISTS "BlogPostStatus";

CREATE TABLE "blogs" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT NOT NULL DEFAULT '',
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "blockquote" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blogs_site_id_slug_key" ON "blogs"("site_id", "slug");

CREATE INDEX "blogs_site_id_active_published_at_idx" ON "blogs"("site_id", "active", "published_at");

CREATE INDEX "blogs_site_id_category_active_published_at_idx" ON "blogs"("site_id", "category", "active", "published_at");

CREATE INDEX "blogs_site_id_created_at_idx" ON "blogs"("site_id", "created_at");

ALTER TABLE "blogs" ADD CONSTRAINT "blogs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
