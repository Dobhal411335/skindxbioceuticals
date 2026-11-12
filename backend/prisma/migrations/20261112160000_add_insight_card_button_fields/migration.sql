-- AlterTable
ALTER TABLE "insight_cards"
ADD COLUMN "button_label" TEXT NOT NULL DEFAULT '',
ADD COLUMN "button_url" TEXT NOT NULL DEFAULT '';
