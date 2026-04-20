-- -- AlterEnum
-- ALTER TYPE "ColumnType" ADD VALUE 'TAGS';

-- AlterTable
ALTER TABLE "mBoardColumn" ADD COLUMN     "intWidth" INTEGER DEFAULT 200;

-- AlterTable
ALTER TABLE "mGroup" ADD COLUMN     "bitCollapsed" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "trDashboardWidget" (
    "intWidget_ID" BIGSERIAL NOT NULL,
    "intBoard_ID" BIGINT NOT NULL,
    "txtTitle" TEXT NOT NULL,
    "txtChartType" TEXT NOT NULL,
    "txtGroupByColumn" TEXT,
    "txtMetricColumn" TEXT,
    "txtAggregation" TEXT DEFAULT 'count',
    "intWidth" INTEGER DEFAULT 6,
    "intHeight" INTEGER DEFAULT 400,
    "intX" INTEGER DEFAULT 0,
    "intY" INTEGER DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trDashboardWidget_pkey" PRIMARY KEY ("intWidget_ID")
);

-- CreateTable
CREATE TABLE "trQuickNote" (
    "intNote_ID" BIGSERIAL NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "txtTitle" TEXT,
    "txtContent" TEXT NOT NULL,
    "txtColor" TEXT DEFAULT '#ffffd1',
    "bitIsPinned" BOOLEAN NOT NULL DEFAULT false,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdated" TIMESTAMP(3),
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trQuickNote_pkey" PRIMARY KEY ("intNote_ID")
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

-- CreateTable
CREATE TABLE "trChatRoom" (
    "intChatRoom_ID" BIGSERIAL NOT NULL,
    "bitIsGroup" BOOLEAN NOT NULL DEFAULT false,
    "txtGroupName" TEXT,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trChatRoom_pkey" PRIMARY KEY ("intChatRoom_ID")
);

-- CreateTable
CREATE TABLE "trChatParticipant" (
    "intParticipant_ID" BIGSERIAL NOT NULL,
    "intChatRoom_ID" BIGINT NOT NULL,
    "intUser_ID" BIGINT NOT NULL,
    "intUnseenMsgs" INTEGER NOT NULL DEFAULT 0,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trChatParticipant_pkey" PRIMARY KEY ("intParticipant_ID")
);

-- CreateTable
CREATE TABLE "trChatMessage" (
    "intMessage_ID" BIGSERIAL NOT NULL,
    "intChatRoom_ID" BIGINT NOT NULL,
    "intSender_ID" BIGINT NOT NULL,
    "txtMessageText" TEXT NOT NULL,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtmUpdated" TIMESTAMP(3),
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trChatMessage_pkey" PRIMARY KEY ("intMessage_ID")
);

-- CreateTable
CREATE TABLE "trInternalMessage" (
    "intMessage_ID" BIGSERIAL NOT NULL,
    "intSender_ID" BIGINT NOT NULL,
    "intRecipient_ID" BIGINT NOT NULL,
    "txtSubject" TEXT NOT NULL,
    "txtBody" TEXT NOT NULL,
    "bitIsRead" BOOLEAN NOT NULL DEFAULT false,
    "bitIsStarred" BOOLEAN NOT NULL DEFAULT false,
    "txtFolder" TEXT NOT NULL DEFAULT 'inbox',
    "txtLabels" TEXT,
    "dtmInserted" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "txtInsertedBy" TEXT,
    "dtmUpdated" TIMESTAMP(3),
    "txtUpdatedBy" TEXT,
    "bitActive" INTEGER DEFAULT 1,

    CONSTRAINT "trInternalMessage_pkey" PRIMARY KEY ("intMessage_ID")
);

-- CreateIndex
CREATE UNIQUE INDEX "trChatParticipant_intChatRoom_ID_intUser_ID_key" ON "trChatParticipant"("intChatRoom_ID", "intUser_ID");

-- AddForeignKey
ALTER TABLE "trDashboardWidget" ADD CONSTRAINT "trDashboardWidget_intBoard_ID_fkey" FOREIGN KEY ("intBoard_ID") REFERENCES "mBoard"("intBoard_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trChatParticipant" ADD CONSTRAINT "trChatParticipant_intChatRoom_ID_fkey" FOREIGN KEY ("intChatRoom_ID") REFERENCES "trChatRoom"("intChatRoom_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trChatParticipant" ADD CONSTRAINT "trChatParticipant_intUser_ID_fkey" FOREIGN KEY ("intUser_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trChatMessage" ADD CONSTRAINT "trChatMessage_intChatRoom_ID_fkey" FOREIGN KEY ("intChatRoom_ID") REFERENCES "trChatRoom"("intChatRoom_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trChatMessage" ADD CONSTRAINT "trChatMessage_intSender_ID_fkey" FOREIGN KEY ("intSender_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trInternalMessage" ADD CONSTRAINT "trInternalMessage_intSender_ID_fkey" FOREIGN KEY ("intSender_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trInternalMessage" ADD CONSTRAINT "trInternalMessage_intRecipient_ID_fkey" FOREIGN KEY ("intRecipient_ID") REFERENCES "mUser"("intUser_ID") ON DELETE CASCADE ON UPDATE CASCADE;
