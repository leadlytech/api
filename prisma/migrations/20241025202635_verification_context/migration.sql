/*
  Warnings:

  - Added the required column `context` to the `verifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EVerificationContext" AS ENUM ('CONFIRM', 'RECOVERY');

-- AlterTable
ALTER TABLE "verifications" ADD COLUMN     "context" "EVerificationContext" NOT NULL;
