-- CreateTable
CREATE TABLE "GameLatencySample" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roundTripMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameLatencySample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GameLatencySample_attemptId_userId_createdAt_idx" ON "GameLatencySample"("attemptId", "userId", "createdAt");
