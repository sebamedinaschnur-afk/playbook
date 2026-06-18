-- CreateEnum
CREATE TYPE "ManualPaymentKind" AS ENUM ('NIL_DEAL', 'OTHER_INCOME');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'APP', 'COLLECTIVE', 'CHECK');

-- CreateEnum
CREATE TYPE "ManualPaymentStatus" AS ENUM ('ACTIVE', 'MERGED', 'KEPT_SEPARATE');

-- CreateEnum
CREATE TYPE "GoalAllocationSource" AS ENUM ('MANUAL_PAYMENT', 'MANUAL_ADHOC');

-- CreateEnum
CREATE TYPE "IncomeTag" AS ENUM ('UNTAGGED', 'NIL_INCOME', 'NOT_INCOME');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "incomeTag" "IncomeTag" NOT NULL DEFAULT 'UNTAGGED',
ADD COLUMN     "isSelfTransfer" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ManualPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "kind" "ManualPaymentKind" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "payer" TEXT,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "taxSetAsideAmount" DOUBLE PRECISION NOT NULL,
    "status" "ManualPaymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "reconciledTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalAllocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "sourceType" "GoalAllocationSource" NOT NULL,
    "sourceManualPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReserveMark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReserveMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuarterlyTaxDate" (
    "id" TEXT NOT NULL,
    "taxYear" INTEGER NOT NULL,
    "quarter" INTEGER NOT NULL,
    "statutoryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuarterlyTaxDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ManualPayment_reconciledTransactionId_key" ON "ManualPayment"("reconciledTransactionId");

-- CreateIndex
CREATE INDEX "ManualPayment_userId_idx" ON "ManualPayment"("userId");

-- CreateIndex
CREATE INDEX "ManualPayment_userId_status_idx" ON "ManualPayment"("userId", "status");

-- CreateIndex
CREATE INDEX "GoalAllocation_userId_idx" ON "GoalAllocation"("userId");

-- CreateIndex
CREATE INDEX "GoalAllocation_goalId_idx" ON "GoalAllocation"("goalId");

-- CreateIndex
CREATE INDEX "ReserveMark_userId_idx" ON "ReserveMark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuarterlyTaxDate_taxYear_quarter_key" ON "QuarterlyTaxDate"("taxYear", "quarter");

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_reconciledTransactionId_fkey" FOREIGN KEY ("reconciledTransactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAllocation" ADD CONSTRAINT "GoalAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAllocation" ADD CONSTRAINT "GoalAllocation_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalAllocation" ADD CONSTRAINT "GoalAllocation_sourceManualPaymentId_fkey" FOREIGN KEY ("sourceManualPaymentId") REFERENCES "ManualPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReserveMark" ADD CONSTRAINT "ReserveMark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
