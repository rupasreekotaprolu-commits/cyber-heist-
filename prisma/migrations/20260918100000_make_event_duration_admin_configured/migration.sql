-- AlterTable
ALTER TABLE "Event"
ALTER COLUMN "durationMinutes" DROP DEFAULT,
ALTER COLUMN "durationMinutes" DROP NOT NULL;
