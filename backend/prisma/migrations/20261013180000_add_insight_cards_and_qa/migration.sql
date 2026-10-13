-- CreateTable
CREATE TABLE "insight_cards" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "image_url" TEXT NOT NULL DEFAULT '',
    "image_public_id" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insight_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_qa_items" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insight_qa_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insight_cards_site_id_order_idx" ON "insight_cards"("site_id", "order");

-- CreateIndex
CREATE INDEX "insight_cards_site_id_active_order_idx" ON "insight_cards"("site_id", "active", "order");

-- CreateIndex
CREATE INDEX "insight_qa_items_site_id_order_idx" ON "insight_qa_items"("site_id", "order");

-- CreateIndex
CREATE INDEX "insight_qa_items_site_id_active_order_idx" ON "insight_qa_items"("site_id", "active", "order");

-- AddForeignKey
ALTER TABLE "insight_cards" ADD CONSTRAINT "insight_cards_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_qa_items" ADD CONSTRAINT "insight_qa_items_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
