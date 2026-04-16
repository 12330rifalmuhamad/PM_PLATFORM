-- AlterTable
-- ALTER TABLE "mBoardColumn" ADD COLUMN     "intWidth" INTEGER DEFAULT 200;

-- CreateTable
CREATE TABLE "trDashboardWidget" (
    "intWidget_ID" BIGSERIAL NOT NULL,
    "intBoard_ID" BIGINT NOT NULL,
    "txtTitle" TEXT NOT NULL,
    "txtChartType" TEXT NOT NULL,
    "txtGroupByColumn" TEXT,
    "txtMetricColumn" TEXT,
    "txtAggregation" TEXT DEFAULT 'count',
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trDashboardWidget_pkey" PRIMARY KEY ("intWidget_ID")
);

-- CreateTable
CREATE TABLE "BoardTemplate" (
    "templateId" SERIAL NOT NULL,
    "templateName" TEXT NOT NULL,
    "description" TEXT,
    "structure" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardTemplate_pkey" PRIMARY KEY ("templateId")
);

-- AddForeignKey
ALTER TABLE "trDashboardWidget" ADD CONSTRAINT "trDashboardWidget_intBoard_ID_fkey" FOREIGN KEY ("intBoard_ID") REFERENCES "mBoard"("intBoard_ID") ON DELETE CASCADE ON UPDATE CASCADE;
