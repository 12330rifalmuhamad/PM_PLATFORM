/*
  Warnings:

  - You are about to drop the column `progressColumnId` on the `trColumnProgressLink` table. All the data in the column will be lost.
  - You are about to drop the column `statusColumnId` on the `trColumnProgressLink` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[intProgressColumn_ID,intStatusColumn_ID]` on the table `trColumnProgressLink` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `intProgressColumn_ID` to the `trColumnProgressLink` table without a default value. This is not possible if the table is not empty.
  - Added the required column `intStatusColumn_ID` to the `trColumnProgressLink` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- ALTER TYPE "ColumnType" ADD VALUE 'TAGS';

-- DropForeignKey
ALTER TABLE "trColumnProgressLink" DROP CONSTRAINT "trColumnProgressLink_progressColumnId_fkey";

-- DropForeignKey
ALTER TABLE "trColumnProgressLink" DROP CONSTRAINT "trColumnProgressLink_statusColumnId_fkey";

-- DropIndex
DROP INDEX "trColumnProgressLink_progressColumnId_statusColumnId_key";

-- AlterTable
ALTER TABLE "trColumnProgressLink" DROP COLUMN "progressColumnId",
DROP COLUMN "statusColumnId",
ADD COLUMN     "intProgressColumn_ID" BIGINT NOT NULL,
ADD COLUMN     "intStatusColumn_ID" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "trTask" ADD COLUMN     "intParentTask_ID" BIGINT;

-- CreateIndex
CREATE UNIQUE INDEX "trColumnProgressLink_intProgressColumn_ID_intStatusColumn_I_key" ON "trColumnProgressLink"("intProgressColumn_ID", "intStatusColumn_ID");

-- AddForeignKey
ALTER TABLE "trTask" ADD CONSTRAINT "trTask_intParentTask_ID_fkey" FOREIGN KEY ("intParentTask_ID") REFERENCES "trTask"("intTask_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trColumnProgressLink" ADD CONSTRAINT "trColumnProgressLink_intProgressColumn_ID_fkey" FOREIGN KEY ("intProgressColumn_ID") REFERENCES "mBoardColumn"("intColumn_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trColumnProgressLink" ADD CONSTRAINT "trColumnProgressLink_intStatusColumn_ID_fkey" FOREIGN KEY ("intStatusColumn_ID") REFERENCES "mBoardColumn"("intColumn_ID") ON DELETE CASCADE ON UPDATE CASCADE;
