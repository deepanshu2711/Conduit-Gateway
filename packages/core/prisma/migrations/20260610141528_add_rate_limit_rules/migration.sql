-- CreateTable
CREATE TABLE "RateLimitRule" (
    "id" TEXT NOT NULL,
    "routeId" TEXT,
    "consumerId" TEXT,
    "maxRequests" INTEGER NOT NULL,
    "windowSec" INTEGER NOT NULL,

    CONSTRAINT "RateLimitRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RateLimitRule" ADD CONSTRAINT "RateLimitRule_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLimitRule" ADD CONSTRAINT "RateLimitRule_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
