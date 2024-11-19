/*
  Warnings:

  - Added the required column `funnelId` to the `edges` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "edges" ADD COLUMN     "funnelId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
