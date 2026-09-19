-- AlterTable
ALTER TABLE `Order`
    ADD COLUMN `paymentStatus` ENUM('UNPAID', 'INITIATED', 'FAILED', 'PAID') NOT NULL DEFAULT 'UNPAID',
    ADD COLUMN `razorpayOrderId` VARCHAR(191) NULL,
    ADD COLUMN `razorpayPaymentId` VARCHAR(191) NULL,
    ADD COLUMN `paidAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `PaymentAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `razorpayOrderId` VARCHAR(191) NOT NULL,
    `razorpayPaymentId` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorDescription` TEXT NULL,
    `source` VARCHAR(191) NOT NULL,
    `payload` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentAttempt_orderId_idx`(`orderId`),
    INDEX `PaymentAttempt_razorpayOrderId_idx`(`razorpayOrderId`),
    INDEX `PaymentAttempt_razorpayPaymentId_idx`(`razorpayPaymentId`),
    INDEX `PaymentAttempt_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Order_razorpayOrderId_key` ON `Order`(`razorpayOrderId`);

-- CreateIndex
CREATE UNIQUE INDEX `Order_razorpayPaymentId_key` ON `Order`(`razorpayPaymentId`);

-- AddForeignKey
ALTER TABLE `PaymentAttempt` ADD CONSTRAINT `PaymentAttempt_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing UPI orders that already passed payment verification
UPDATE `Order`
SET `paymentStatus` = 'PAID',
    `paidAt` = `updatedAt`
WHERE `status` IN ('CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED');

UPDATE `Order`
SET `paymentStatus` = 'INITIATED'
WHERE `status` IN ('PAYMENT_UPLOADED', 'VERIFYING')
   OR (`status` = 'PLACED' AND (`upiReferenceNumber` IS NOT NULL OR `paymentScreenshot` IS NOT NULL));
