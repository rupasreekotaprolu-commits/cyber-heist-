-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "questionCounts" JSONB,
ADD COLUMN "roundMarks" JSONB,
ADD COLUMN "activeQuestionIds" JSONB,
ADD COLUMN "totalMarks" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN "resultsFinalized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "finalizedAt" TIMESTAMP(3),
ADD COLUMN "leaderboardReleased" BOOLEAN NOT NULL DEFAULT false;
