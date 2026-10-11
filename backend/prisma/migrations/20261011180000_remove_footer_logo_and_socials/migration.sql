-- DropForeignKey
ALTER TABLE "footer_social_links" DROP CONSTRAINT "footer_social_links_footer_config_id_fkey";

-- DropTable
DROP TABLE "footer_social_links";

-- AlterTable
ALTER TABLE "footer_configs" DROP COLUMN "logo_url",
DROP COLUMN "logo_public_id";
