-- CreateEnum
CREATE TYPE "CircuitState" AS ENUM ('closed', 'open', 'half');

-- CreateTable
CREATE TABLE "CircuitBreakerState" (
    "targetUrl" TEXT NOT NULL,
    "state" "CircuitState" NOT NULL DEFAULT 'closed',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastFailureAt" TIMESTAMP(3),
    "opensAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CircuitBreakerState_pkey" PRIMARY KEY ("targetUrl")
);
