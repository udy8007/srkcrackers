CREATE TABLE IF NOT EXISTS `PaymentSettings` (
    `id` VARCHAR(191) NOT NULL,
    `razorpayEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `PaymentSettings` (`id`, `razorpayEnabled`, `createdAt`, `updatedAt`)
VALUES ('default', false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
