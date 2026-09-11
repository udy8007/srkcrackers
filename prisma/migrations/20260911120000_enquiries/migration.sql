-- CreateTable
CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enquiryNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "lastPendingReminderAt" DATETIME,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Enquiry_enquiryNumber_key" ON "Enquiry"("enquiryNumber");

-- CreateIndex
CREATE INDEX "Enquiry_phone_idx" ON "Enquiry"("phone");

-- CreateIndex
CREATE INDEX "Enquiry_status_idx" ON "Enquiry"("status");

-- CreateIndex
CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");

-- AlterTable
ALTER TABLE "EmailSettings" ADD COLUMN "notifyAdminNewEnquiry" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "EmailSettings" ADD COLUMN "notifyCustomerEnquiryResolved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "EmailSettings" ADD COLUMN "notifyAdminEnquiryPendingReminder" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "AdminNotification" ADD COLUMN "enquiryId" TEXT;
ALTER TABLE "AdminNotification" ADD COLUMN "enquiryNumber" TEXT;

-- AlterTable
ALTER TABLE "AdminPushLog" ADD COLUMN "enquiryId" TEXT;
ALTER TABLE "AdminPushLog" ADD COLUMN "enquiryNumber" TEXT;

-- CreateIndex
CREATE INDEX "AdminPushLog_enquiryId_idx" ON "AdminPushLog"("enquiryId");
