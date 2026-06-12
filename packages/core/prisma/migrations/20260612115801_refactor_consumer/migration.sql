/*
  Warnings:

  - Added the required column `apiHashKey` to the `Consumer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Consumer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Scopes" AS ENUM ('read', 'write', 'admin');

-- AlterTable
ALTER TABLE "Consumer" ADD COLUMN     "apiHashKey" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "scopes" "Scopes"[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
