import { prisma } from "../../lib/prisma.js";

const threshold = Number(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5;
const cooldownMs =
  (Number(process.env.CIRCUIT_BREAKER_COOLDOWN_SEC) || 30) * 1000;

async function allowRequest(targetUrl: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(
      `SELECT 1 FROM "CircuitBreakerState" WHERE "targetUrl" = $1 FOR UPDATE`,
      targetUrl,
    );

    let row = await tx.circuitBreakerState.findUnique({
      where: { targetUrl },
    });

    if (!row) {
      await tx.circuitBreakerState.create({ data: { targetUrl } });
      return true;
    }

    if (row.state === "closed") return true;

    if (row.state === "open") {
      if (row.opensAt && new Date() >= row.opensAt) {
        await tx.circuitBreakerState.update({
          where: { targetUrl },
          data: { state: "half" },
        });
        return true;
      }
      return false;
    }

    return false;
  });
}

async function recordSuccess(targetUrl: string): Promise<void> {
  try {
    await prisma.circuitBreakerState.update({
      where: { targetUrl },
      data: {
        state: "closed",
        failureCount: 0,
        lastFailureAt: null,
        opensAt: null,
      },
    });
  } catch {}
}

async function recordFailure(targetUrl: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(
      `SELECT 1 FROM "CircuitBreakerState" WHERE "targetUrl" = $1 FOR UPDATE`,
      targetUrl,
    );

    const row = await tx.circuitBreakerState.findUnique({
      where: { targetUrl },
    });
    if (!row) return;

    const newCount = row.failureCount + 1;

    if (row.state === "half" || newCount >= threshold) {
      await tx.circuitBreakerState.update({
        where: { targetUrl },
        data: {
          state: "open",
          failureCount: newCount,
          lastFailureAt: new Date(),
          opensAt: new Date(Date.now() + cooldownMs),
        },
      });
    } else {
      await tx.circuitBreakerState.update({
        where: { targetUrl },
        data: {
          failureCount: newCount,
          lastFailureAt: new Date(),
        },
      });
    }
  });
}

export const circuitBreaker = {
  allowRequest,
  recordSuccess,
  recordFailure,
};
