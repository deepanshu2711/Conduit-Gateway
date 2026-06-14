Circuit Breaker Implementation Guide
Overview
A circuit breaker protects your gateway from repeatedly hammering a dead upstream service. Without it, every request waits for a 5s timeout before failing — 100 concurrent users means 500 threads-seconds of wasted latency. The circuit breaker detects failures, "opens" the circuit, and rejects subsequent requests instantly (503) until a cooldown period passes, then allows a probe request to see if the service recovered.

1. Database — Prisma Model
   File: packages/core/prisma/schema.prisma
   Add this model:
   model CircuitBreakerState {
   targetUrl String @id
   state String @default("closed") // "closed" | "open" | "half-open"
   failureCount Int @default(0)
   lastFailureAt DateTime?
   opensAt DateTime? // when the circuit transitions to half-open for a probe
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   }
   Then run npx prisma migrate dev --name add-circuit-breaker (from packages/core).
2. Configuration — Environment Variables
   Add these defaults to your .env (or wherever env vars are loaded):
   CIRCUIT_BREAKER_THRESHOLD=5 # failures before opening
   CIRCUIT_BREAKER_COOLDOWN_SEC=30 # seconds to wait before half-open probe
   These get read via process.env with fallback defaults.
3. New File — Circuit Breaker Service
   File: packages/core/src/modules/circuitBreaker/circuitBreaker.ts
   This is the core state machine. It needs two public methods:
   allowRequest(targetUrl: string): Promise<boolean>

- Query CircuitBreakerState from DB by targetUrl
- If no row exists → create one with state "closed" → return true
- If state === "closed" → return true
- If state === "open":
- Check if now >= opensAt
- If yes → update state to "half-open" → return true (this is the probe)
- If no → return false
- If state === "half-open" → return false (only one probe at a time; the probe request already passed through)
  Wait — half-open nuance: The way opensAt is checked above, once the timer expires, the first request that checks becomes the probe (state → half-open). All subsequent requests while half-open get rejected. If the probe succeeds (recordSuccess), the circuit closes and all requests flow again.
  But there's a simpler approach: when state === "open" and time has elapsed, transition to "closed" optimistically and let failures re-open it. I recommend the probe pattern (half-open) instead, as it's safer.
  recordSuccess(targetUrl: string): Promise<void>
- Update row: state = "closed", failureCount = 0, lastFailureAt = null, opensAt = null
  recordFailure(targetUrl: string): Promise<void>
- Read current state
- Increment failureCount, set lastFailureAt = now
- If state === "half-open" OR failureCount >= threshold:
- Set state = "open", failureCount = 0, opensAt = now + cooldownSec \* 1000
- Save to DB
  Concurrency note
  Multiple concurrent requests may check allowRequest simultaneously. Use a row-level lock (SELECT ... FOR UPDATE) when reading state in allowRequest and recordFailure to prevent race conditions. With Prisma, you can use $transaction with prisma.$queryRawUnsafe('SELECT ... FROM "CircuitBreakerState" WHERE "targetUrl" = $1 FOR UPDATE', targetUrl).
  Singleton access
  Export a simple object or class with static methods:
  export const circuitBreaker = {
  allowRequest(targetUrl: string): Promise<boolean>,
  recordSuccess(targetUrl: string): Promise<void>,
  recordFailure(targetUrl: string): Promise<void>,
  };

4. Modify Forwarder
   File: packages/core/src/modules/proxy/forwarder.ts
   Changes needed (around line 22)
   Before reply.from() — check circuit:
   const allowed = await circuitBreaker.allowRequest(targetUrl);
   if (!allowed) {
   return error(reply, null, 503, "Service Unavailable (circuit breaker open)");
   }
   In onResponse callback — record outcome:
   onResponse: async (\_request, \_reply, res) => {
   const latency = Date.now() - startTime;
   const statusCode = res.statusCode ?? 0;

// Record circuit breaker outcome
if (statusCode >= 500 || statusCode === 0) {
await circuitBreaker.recordFailure(targetUrl);
} else {
await circuitBreaker.recordSuccess(targetUrl);
}

// Existing logging
await logQueue.add("log", {
routeId: route.id,
method: request.method.toUpperCase() as HttpMethod,
path: request.url,
statusCode,
latency,
ip: request.ip,
});
},
Handle reply.from() errors — catch the promise (since reply.from may return a promise in newer fastify versions, or handle via an error event):
try {
await reply.from(targetUrl, { ... });
} catch (err) {
await circuitBreaker.recordFailure(targetUrl);
// Error response is already handled by fastify, or send a 502
if (!reply.sent) {
return error(reply, null, 502, "Bad Gateway");
}
}
Note: @fastify/reply-from in Fastify v5 may not return a promise — it uses the request/response pipeline. Check if reply.from() returns a Promise<FastifyReply> or uses callbacks. If it doesn't support await, use the onResponse callback and a reply.raw.on('error', ...) listener for transport errors. 5. What the Full Flow Looks Like
gateway.handler.ts
├─ findRoute(path) → match route
├─ checkRateLimit(route.id) → rate limit check
└─ forwarder(request, reply, route)
├─ method check
├─ circuitBreaker.allowRequest(targetUrl)
│ └─ DB query → if open → 503
├─ reply.from(targetUrl, { onResponse })
│ └─ onResponse fires:
│ ├─ status >= 500 → circuitBreaker.recordFailure()
│ │ └─ DB update → may flip to open
│ └─ status 2xx → circuitBreaker.recordSuccess()
│ └─ DB update → reset to closed
└─ on error (connection refused, timeout):
└─ circuitBreaker.recordFailure()
└─ DB update → may flip to open 6. State Machine Summary
Current State Event
Closed Success
Closed Failure (count < threshold)
Closed Failure (count >= threshold)
Open Request arrives (before opensAt)
Open Request arrives (after opensAt)
Half-Open Probe succeeds
Half-Open Probe fails
Half-Open Extra request arrives 7. Files to Create/Modify (Summary)
Action File
Create packages/core/src/modules/circuitBreaker/circuitBreaker.ts
Modify packages/core/prisma/schema.prisma (add model)
Modify packages/core/src/modules/proxy/forwarder.ts (add circuit check + recording)
Modify .env (add env vars)
