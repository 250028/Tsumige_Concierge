-- AlterTable
ALTER TABLE `users` ADD COLUMN `loginId` VARCHAR(50) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_loginId_key` ON `users`(`loginId`);

