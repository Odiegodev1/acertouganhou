-- AlterEnum
ALTER TYPE "PaymentDepositStatus" ADD VALUE 'RECONCILIATION_REQUIRED';

-- AlterTable
ALTER TABLE "payment_webhook_events" ALTER COLUMN "provider" SET DEFAULT 'CAJUPAY';
