-- CreateTable
CREATE TABLE "footer_configs" (
    "id" UUID NOT NULL,
    "site_id" UUID NOT NULL,
    "thank_you" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "logo_url" TEXT NOT NULL DEFAULT '',
    "logo_public_id" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_columns" (
    "id" UUID NOT NULL,
    "footer_config_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_links" (
    "id" UUID NOT NULL,
    "column_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '#',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_social_links" (
    "id" UUID NOT NULL,
    "footer_config_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon_key" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "footer_configs_site_id_key" ON "footer_configs"("site_id");

-- CreateIndex
CREATE INDEX "footer_columns_footer_config_id_order_idx" ON "footer_columns"("footer_config_id", "order");

-- CreateIndex
CREATE INDEX "footer_links_column_id_order_idx" ON "footer_links"("column_id", "order");

-- CreateIndex
CREATE INDEX "footer_social_links_footer_config_id_order_idx" ON "footer_social_links"("footer_config_id", "order");

-- AddForeignKey
ALTER TABLE "footer_configs" ADD CONSTRAINT "footer_configs_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_columns" ADD CONSTRAINT "footer_columns_footer_config_id_fkey" FOREIGN KEY ("footer_config_id") REFERENCES "footer_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_links" ADD CONSTRAINT "footer_links_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "footer_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_social_links" ADD CONSTRAINT "footer_social_links_footer_config_id_fkey" FOREIGN KEY ("footer_config_id") REFERENCES "footer_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
