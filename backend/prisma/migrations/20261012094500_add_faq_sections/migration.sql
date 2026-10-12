-- CreateTable
CREATE TABLE "faq_sections" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "show_on_landing" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_sections_site_id_order_idx" ON "faq_sections"("site_id", "order");

-- CreateIndex
CREATE INDEX "faq_sections_site_id_active_order_idx" ON "faq_sections"("site_id", "active", "order");

-- CreateIndex
CREATE INDEX "faq_items_section_id_order_idx" ON "faq_items"("section_id", "order");

-- CreateIndex
CREATE INDEX "faq_items_section_id_active_order_idx" ON "faq_items"("section_id", "active", "order");

-- CreateIndex
CREATE INDEX "faq_items_section_id_show_on_landing_idx" ON "faq_items"("section_id", "show_on_landing");

-- AddForeignKey
ALTER TABLE "faq_sections" ADD CONSTRAINT "faq_sections_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "faq_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
