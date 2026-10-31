ALTER TABLE "webpages"
  ADD COLUMN "design13_hero_mini_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_hero_main_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_hero_description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_hero_image" JSONB,
  ADD COLUMN "design13_process_mini_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_process_main_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_process_timeline" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "design13_faq_mini_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_faq_main_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_faq_items" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "design13_explore_mini_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_explore_main_heading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "design13_explore_cards" JSONB NOT NULL DEFAULT '[]';
