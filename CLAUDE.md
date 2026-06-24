# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Start all apps in dev (gateway + dashboard + docs)
npm run dev

# Build all packages
npm run build

# Lint all packages
npm run lint

# Type-check all packages
npm run check-types

# Format with Prettier
npm run format
```

**Gateway only** (from `packages/core`):
```sh
npx tsc -b && node dist/server.js
```

**Database migrations** (from `packages/core`):
```sh
npx prisma migrate dev       # apply migrations in dev
npx prisma generate          # regenerate client after schema changes
```

**Infrastructure** (Docker required):
```sh
docker compose up -d postgres redis   # start dependencies only
docker compose up -d                  # start everything including the gateway
```

There are no tests yet.

## Environment

The gateway reads from `packages/core/.env`. Required variables:

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://conduit:conduit@localhost:5432/conduit` | PostgreSQL connection |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `CIRCUIT_BREAKER_THRESHOLD` | `5` | Failures before opening |
| `CIRCUIT_BREAKER_COOLDOWN_SEC` | `30` | Seconds before half-open probe |
| `CORS_ORIGIN` | `*` | Comma-separated origins |

## Architecture

This is a Turborepo monorepo with npm workspaces:

- `packages/core` — Fastify gateway (the main engine, port 3000)
- `apps/web` — Next.js 16 admin dashboard (port 3000 in dev)
- `apps/docs` — Next.js docs site
- `packages/ui` — Shared React components
- `packages/eslint-config` / `packages/typescript-config` — Shared configs

### Request lifecycle (packages/core)

Every incoming request passes through this chain in `src/app.ts`:

1. **`ipFilter`** (`middleware/ipFilter.ts`) — checks active `IpRule` records (ALLOW/DENY CIDRs). If ALLOW rules exist, the request must match one. DENY rules are checked after.
2. **`resolveConsumer`** (`middleware/auth.ts`) — looks up `Bearer` token (SHA-256 hashed) in `Consumer` table; attaches `request.consumer` if found.
3. **`enforceAdmin`** (`middleware/auth.ts`) — gates `/api/v1/admin/*` routes, requiring `admin` scope on the resolved consumer.
4. **`gatewayHandler`** (`modules/proxy/gateway.handler.ts`) — matches URL prefix to a `Route`, checks rate limit via Redis counter, then calls `forwarder`.
5. **`forwarder`** (`modules/proxy/forwarder.ts`) — validates HTTP method, checks circuit breaker state, optionally serves from Redis cache (GET/HEAD on public routes), forwards via native `fetch`, records outcome, enqueues a log entry to BullMQ.

Admin CRUD routes are registered under `/api/v1/admin/` for: `routes`, `rate-limiting`, `consumer`, `ip-rule`.

### Module structure inside packages/core/src

```
modules/
  admin/
    routes/          # Route CRUD (routes.routes.ts → controller → service → repository)
    consumer/        # Consumer CRUD
    rateLimiting/    # RateLimitRule CRUD
    ipRule/          # IpRule CRUD
  proxy/
    gateway.handler  # Entry point for all proxied requests
    forwarder        # Upstream fetch, caching, circuit breaker integration
    route            # Route lookup with prefix matching
  circuitBreaker/
    circuitBreaker   # Postgres-backed state machine (closed/open/half)
middleware/
  auth.ts            # resolveConsumer + enforceAdmin
  ipFilter.ts        # CIDR allowlist/denylist
  rateLimiter.ts     # Redis counter per routeId
plugins/
  redis.ts           # Shared ioredis client
  queue.ts           # BullMQ queue for async log writes
  logWorker.ts       # BullMQ worker that persists RequestLog records
```

### Key patterns

- **Admin modules** follow a layered pattern: `routes.ts` (Fastify plugin with Zod schema) → `controller.ts` → `service.ts` → `repository.ts` (Prisma).
- **Prisma client** is generated into `src/generated/prisma/` (not the default location). Import from `../lib/prisma.js` (singleton) or `../generated/prisma/client.js` for types.
- **Circuit breaker** state is stored in Postgres (`CircuitBreakerState`), using `SELECT ... FOR UPDATE` inside transactions to prevent race conditions.
- **Response caching** is Redis-based, keyed by `method:url`. Only applies to GET/HEAD on routes with `cacheEnabled=true` and no auth.
- **Request logging** is fully async: the forwarder enqueues to BullMQ (`logWorker.ts` processes it), so logging never adds latency to the request path.
- All packages use ES modules (`"type": "module"`). Internal imports must include `.js` extensions even for `.ts` source files.
- Zod schemas in `*.schema.ts` files are used for both validation and serialization via `fastify-type-provider-zod`.
