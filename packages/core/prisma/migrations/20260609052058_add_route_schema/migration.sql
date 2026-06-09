-- CreateEnum
CREATE TYPE "HttpMethod" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS');

-- AlterTable
ALTER TABLE "Consumer" ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "stripPrefix" BOOLEAN NOT NULL DEFAULT true,
    "authRequired" BOOLEAN NOT NULL DEFAULT false,
    "methods" "HttpMethod"[],
    "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Route_prefix_key" ON "Route"("prefix");
