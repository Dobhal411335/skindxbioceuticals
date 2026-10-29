-- Convert product highlights from single text values to FAQ question/answer pairs.
ALTER TABLE "product_highlights"
  ADD COLUMN "question" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "answer" TEXT NOT NULL DEFAULT '';

UPDATE "product_highlights"
SET "question" = "text",
    "answer" = ''
WHERE "text" IS NOT NULL;

ALTER TABLE "product_highlights"
  DROP COLUMN "text";
