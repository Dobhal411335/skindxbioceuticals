-- CreateTable
CREATE TABLE "product_pdfs" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "pdf_url" TEXT NOT NULL,
    "pdf_public_id" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pdfs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_pdfs_product_id_sort_order_idx" ON "product_pdfs"("product_id", "sort_order");

-- AddForeignKey
ALTER TABLE "product_pdfs" ADD CONSTRAINT "product_pdfs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
