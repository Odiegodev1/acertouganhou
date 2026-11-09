-- CreateEnum
CREATE TYPE "PaymentDepositStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "PaymentWithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentWebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "payment_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "availableBalance" INTEGER NOT NULL DEFAULT 0,
    "reservedBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_deposits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentDepositStatus" NOT NULL DEFAULT 'PENDING',
    "providerTransactionId" TEXT,
    "providerOrderId" TEXT,
    "pixCopyPaste" TEXT,
    "pixQrCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "creditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_deposits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_withdrawals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "pixKey" TEXT NOT NULL,
    "pixKeyType" TEXT NOT NULL,
    "status" "PaymentWithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "providerTransactionId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SKALAPAY',
    "eventType" TEXT NOT NULL,
    "transactionId" TEXT,
    "orderId" TEXT,
    "eventHash" TEXT NOT NULL,
    "status" "PaymentWebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_accounts_userId_key" ON "payment_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_deposits_providerTransactionId_key" ON "payment_deposits"("providerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_deposits_providerOrderId_key" ON "payment_deposits"("providerOrderId");

-- CreateIndex
CREATE INDEX "payment_deposits_userId_createdAt_idx" ON "payment_deposits"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_deposits_status_createdAt_idx" ON "payment_deposits"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_withdrawals_providerTransactionId_key" ON "payment_withdrawals"("providerTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_withdrawals_idempotencyKey_key" ON "payment_withdrawals"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payment_withdrawals_userId_createdAt_idx" ON "payment_withdrawals"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "payment_withdrawals_status_createdAt_idx" ON "payment_withdrawals"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_eventHash_key" ON "payment_webhook_events"("eventHash");

-- CreateIndex
CREATE INDEX "payment_webhook_events_transactionId_idx" ON "payment_webhook_events"("transactionId");

-- CreateIndex
CREATE INDEX "payment_webhook_events_orderId_idx" ON "payment_webhook_events"("orderId");

-- AddForeignKey
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_deposits" ADD CONSTRAINT "payment_deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_withdrawals" ADD CONSTRAINT "payment_withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
