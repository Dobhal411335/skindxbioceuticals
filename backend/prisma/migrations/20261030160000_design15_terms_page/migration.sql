ALTER TABLE "webpages"
  ADD COLUMN "design15_hero_mini_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design15_hero_main_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design15_hero_description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design15_notice_mini_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design15_notice_main_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design15_notice_description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design15_faq_items" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "design15_explore_cards" JSONB NOT NULL DEFAULT '[]';
