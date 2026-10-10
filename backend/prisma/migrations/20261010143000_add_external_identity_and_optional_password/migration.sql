-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE');

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL,
ADD COLUMN "image_url" TEXT;

-- CreateTable
CREATE TABLE "external_identities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "external_identities_user_id_idx" ON "external_identities"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "external_identities_provider_provider_user_id_key" ON "external_identities"("provider", "provider_user_id");

-- AddForeignKey
ALTER TABLE "external_identities" ADD CONSTRAINT "external_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
