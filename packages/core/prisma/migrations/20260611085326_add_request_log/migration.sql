/*
  Warnings:

  - A unique constraint covering the columns `[routeId,consumerId]` on the table `RateLimitRule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `RateLimitRule` table without a default value. This is not possible if the table is not empty.
  - Made the column `routeId` on table `RateLimitRule` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "RateLimitRule" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "routeId" SET NOT NULL;

-- CreateTable
CREATE TABLE "RequestLog" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "consumerId" TEXT,
    "methods" "HttpMethod" NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER,
    "latency" INTEGER,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestLog_routeId_idx" ON "RequestLog"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimitRule_routeId_consumerId_key" ON "RateLimitRule"("routeId", "consumerId");
