-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEMO_CREDIT', 'GAME_DEBIT', 'GAME_PRIZE', 'GAME_REFUND');

-- CreateEnum
CREATE TYPE "GameAttemptStatus" AS ENUM ('RUNNING', 'WON', 'LOST', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PrizeClaimStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prizes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "value" INTEGER NOT NULL,
    "playCost" INTEGER NOT NULL,
    "targetMs" INTEGER NOT NULL DEFAULT 5000,
    "speedFactor" INTEGER NOT NULL DEFAULT 1500,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "status" "GameAttemptStatus" NOT NULL DEFAULT 'RUNNING',
    "targetMs" INTEGER NOT NULL,
    "speedFactor" INTEGER NOT NULL,
    "playCost" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),
    "elapsedMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prize_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prizeId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "status" "PrizeClaimStatus" NOT NULL DEFAULT 'PENDING',
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "prize_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_referenceId_key" ON "wallet_transactions"("referenceId");

-- CreateIndex
CREATE INDEX "wallet_transactions_userId_createdAt_idx" ON "wallet_transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "game_attempts_userId_status_idx" ON "game_attempts"("userId", "status");

-- CreateIndex
CREATE INDEX "game_attempts_prizeId_createdAt_idx" ON "game_attempts"("prizeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "prize_claims_attemptId_key" ON "prize_claims"("attemptId");

-- CreateIndex
CREATE INDEX "prize_claims_userId_createdAt_idx" ON "prize_claims"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_attempts" ADD CONSTRAINT "game_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_attempts" ADD CONSTRAINT "game_attempts_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "prizes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prize_claims" ADD CONSTRAINT "prize_claims_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "game_attempts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
