-- CreateEnum
CREATE TYPE "IpRuleType" AS ENUM ('ALLOW', 'DENY');

-- AlterTable
ALTER TABLE "Route" ADD COLUMN     "cacheEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cacheTtlSec" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "IpRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'unknown',
    "cidr" TEXT NOT NULL,
    "type" "IpRuleType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpRule_pkey" PRIMARY KEY ("id")
);
