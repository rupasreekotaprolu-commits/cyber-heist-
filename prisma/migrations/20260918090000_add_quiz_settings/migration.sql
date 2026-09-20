-- AlterTable
ALTER TABLE "Event"
ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Cyber Heist',
ADD COLUMN "negativeMarkingEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "negativeMarkingValue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "allowAnswerRevision" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "studentScoreVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "correctnessFeedbackVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "liveLeaderboardVisible" BOOLEAN NOT NULL DEFAULT false;
