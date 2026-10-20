-- CreateTable
CREATE TABLE "webpages" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "template_type" TEXT NOT NULL DEFAULT 'design1',
    "title_line" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "first_title" TEXT NOT NULL DEFAULT '',
    "second_title" TEXT NOT NULL DEFAULT '',
    "image_first" JSONB,
    "image_first_mobile" JSONB,
    "banner_image" JSONB,
    "banner_image_mobile" JSONB,
    "paragraph_first_image" JSONB,
    "paragraph_second_image" JSONB,
    "advertisement_image" JSONB,
    "side_thumb_image" JSONB,
    "main_profile_image" JSONB,
    "create_tags" JSONB NOT NULL DEFAULT '[]',
    "posted_by" JSONB NOT NULL DEFAULT '{"admin":false,"user":false}',
    "highlights" JSONB NOT NULL DEFAULT '[]',
    "paragraph_sections" JSONB NOT NULL DEFAULT '[]',
    "table_title" TEXT NOT NULL DEFAULT '',
    "table_rows" JSONB NOT NULL DEFAULT '[]',
    "blockquote_main_title" TEXT NOT NULL DEFAULT '',
    "blockquote_left_title" TEXT NOT NULL DEFAULT '',
    "blockquote_description" TEXT NOT NULL DEFAULT '',
    "blockquote_tags" JSONB NOT NULL DEFAULT '[]',
    "accordion_tags" JSONB NOT NULL DEFAULT '[]',
    "advertisements" JSONB NOT NULL DEFAULT '[]',
    "advertisement_url" TEXT NOT NULL DEFAULT '',
    "side_thumb_name" TEXT NOT NULL DEFAULT '',
    "side_thumb_designation" TEXT NOT NULL DEFAULT '',
    "side_thumb_description" TEXT NOT NULL DEFAULT '',
    "facebook_url" TEXT NOT NULL DEFAULT '',
    "youtube_url" TEXT NOT NULL DEFAULT '',
    "insta_url" TEXT NOT NULL DEFAULT '',
    "google_url" TEXT NOT NULL DEFAULT '',
    "image_gallery" JSONB NOT NULL DEFAULT '[]',
    "notices" JSONB NOT NULL DEFAULT '[]',
    "search_locations" JSONB NOT NULL DEFAULT '[]',
    "design5_chip" TEXT NOT NULL DEFAULT '',
    "design5_main_heading" TEXT NOT NULL DEFAULT '',
    "grid_cards" JSONB NOT NULL DEFAULT '[]',
    "design6_chip" TEXT NOT NULL DEFAULT '',
    "design6_explore_link" TEXT NOT NULL DEFAULT '',
    "design6_main_heading" TEXT NOT NULL DEFAULT '',
    "design6_sub_heading" TEXT NOT NULL DEFAULT '',
    "design6_author" TEXT NOT NULL DEFAULT '',
    "design6_mid_heading" TEXT NOT NULL DEFAULT '',
    "design6_mid_link" TEXT NOT NULL DEFAULT '',
    "team_cards" JSONB NOT NULL DEFAULT '[]',
    "design7_chip" TEXT NOT NULL DEFAULT '',
    "design7_explore_link" TEXT NOT NULL DEFAULT '',
    "design7_main_heading" TEXT NOT NULL DEFAULT '',
    "design9_mini_heading" TEXT NOT NULL DEFAULT '',
    "design9_main_heading" TEXT NOT NULL DEFAULT '',
    "design9_description" TEXT NOT NULL DEFAULT '',
    "design9_cards" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webpages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webpages_site_id_active_idx" ON "webpages"("site_id", "active");

-- CreateIndex
CREATE INDEX "webpages_site_id_created_at_idx" ON "webpages"("site_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "webpages_site_id_slug_key" ON "webpages"("site_id", "slug");

-- AddForeignKey
ALTER TABLE "webpages" ADD CONSTRAINT "webpages_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
