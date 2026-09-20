-- CreateEnum
CREATE TYPE "LoginActor" AS ENUM ('TEAM', 'ADMIN');

-- CreateTable
CREATE TABLE "LoginAudit" (
    "id" TEXT NOT NULL,
    "actorType" "LoginActor" NOT NULL,
    "succeeded" BOOLEAN NOT NULL,
    "teamId" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAudit_teamId_createdAt_idx" ON "LoginAudit"("teamId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAudit_adminId_createdAt_idx" ON "LoginAudit"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAudit_actorType_createdAt_idx" ON "LoginAudit"("actorType", "createdAt");

-- AddForeignKey
ALTER TABLE "LoginAudit" ADD CONSTRAINT "LoginAudit_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginAudit" ADD CONSTRAINT "LoginAudit_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
