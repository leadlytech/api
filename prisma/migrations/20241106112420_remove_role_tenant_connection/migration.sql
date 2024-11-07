/*
  Warnings:

  - You are about to drop the column `tenantId` on the `roles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "roles" DROP CONSTRAINT "roles_tenantId_fkey";

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "tenantId";
