ALTER TABLE "navbar_sections"
ADD COLUMN "menu_heading" TEXT NOT NULL DEFAULT '',
ADD COLUMN "menu_description" TEXT NOT NULL DEFAULT '';

ALTER TABLE "navbar_sub_sections"
ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
