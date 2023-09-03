/*
  Warnings:

  - You are about to drop the column `nation` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `nation` on the `User` table. All the data in the column will be lost.
  - Added the required column `continent` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `continent` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "nation",
ADD COLUMN     "continent" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "nation",
ADD COLUMN     "continent" TEXT NOT NULL;
