-- AlterTable
ALTER TABLE "AccessCode" ADD COLUMN     "redeemedAt" TIMESTAMP(3),
ADD COLUMN     "redeemedById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccessCode_redeemedById_key" ON "AccessCode"("redeemedById");

-- AddForeignKey
ALTER TABLE "AccessCode" ADD CONSTRAINT "AccessCode_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

