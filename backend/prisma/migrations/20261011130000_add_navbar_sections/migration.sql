-- CreateTable
CREATE TABLE "navbar_sections" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '#',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navbar_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "navbar_sub_sections" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '#',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "navbar_sub_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "navbar_sections_site_id_order_idx" ON "navbar_sections"("site_id", "order");

-- CreateIndex
CREATE INDEX "navbar_sub_sections_section_id_order_idx" ON "navbar_sub_sections"("section_id", "order");

-- AddForeignKey
ALTER TABLE "navbar_sections" ADD CONSTRAINT "navbar_sections_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "navbar_sub_sections" ADD CONSTRAINT "navbar_sub_sections_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "navbar_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
