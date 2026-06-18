<div align="center">

# Conduit Gateway

**A lightweight, self-hosted API gateway for developers**

<!-- badges -->
<img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"/>
<img src="https://img.shields.io/badge/Node.js-18%2B-339933" alt="Node.js 18+"/>
<img src="https://img.shields.io/badge/TypeScript-5.9-3178C6" alt="TypeScript 5.9"/>

**open source · self-hosted · MIT licensed**

</div>

Build the gateway. Open source it. Own the ecosystem.

A complete blueprint for building a production-grade API Gateway — and turning it into a thriving open source project that becomes the foundation of your entire dev stack.

- Node.js + TypeScript
- Fastify
- PostgreSQL
- Redis
- Docker
- Plugin system
- React dashboard

---

## 01 / Architecture

How every request flows. One entry point for all your projects. Every request passes through the same middleware chain — auth, rate limiting, routing, circuit breaking — before reaching your services.

### Request lifecycle

```
Client request
    ↓
[ Rate Limiter ]       // Redis token bucket — checked first, cheapest to fail
    ↓
[ Auth Verifier ]      // JWT decoded → verified with your Auth system
    ↓
[ Transformer ]        // CORS headers, body rewrite, header injection
    ↓
[ Dynamic Router ]     // Route table lookup (cached in Redis)
    ↓
[ Circuit Breaker ]    // Is the target healthy? open/half-open/closed
    ↓
[ Forwarder ]          // HTTP proxy to target_url
    ↓
[ Logger ]             // Async log to Postgres via BullMQ
    ↓
Response to client
```

The middleware chain is a Fastify plugin pipeline. Each step is an isolated plugin. Adding a new capability = writing one plugin. Removing one = one config flag. No spaghetti, no coupling.

```ts
// src/server.ts — the actual wiring
import Fastify from 'fastify'
import { rateLimiter }       from './middleware/rateLimiter'
import { authVerifier }      from './middleware/authVerifier'
import { requestTransformer }from './middleware/requestTransformer'
import { router }            from './proxy/router'
import { circuitBreaker }    from './proxy/circuitBreaker'
import { forwarder }         from './proxy/forwarder'

const app = Fastify({ logger: true })

app.addHook('onRequest', rateLimiter)
app.addHook('onRequest', authVerifier)
app.addHook('onRequest', requestTransformer)

app.all('/*', async (req, reply) => {
  const route = await router.match(req.url)
  if (!route) return reply.code(404).send({ error: 'No route' })

  const cb = circuitBreaker.get(route.targetUrl)
  if (cb.isOpen()) return reply.code(503).send({ error: 'Service unavailable' })

  const result = await forwarder.forward(req, route)
  reply.send(result)
})

await app.listen({ port: 3000 })
```

---

## 02 / Features

Every feature is modular. Build in phases — ship the core first, add advanced features when you have users asking for them.

### Phase 1 — Core (weeks 1–2)

| Feature | Description |
|---------|-------------|
| Basic HTTP proxy + dynamic routing | Route table backed by Postgres |
| JWT auth verification | Validates against your Auth system (plugs into Clerk, etc.) |
| Rate limiting | Redis token bucket per consumer + route |
| Admin API | CRUD for routes, consumers, rules |
| Request logging | Async to Postgres via BullMQ (zero latency impact) |
| Docker image | Published to Docker Hub — one-command install |

### Phase 2 — Reliability (weeks 3–4)

| Feature | Description |
|---------|-------------|
| Circuit breaker | Open/half-open/closed state machine per upstream — fail fast |
| Retry with exponential backoff | Configurable per route — handles flaky services |
| Health-aware routing | Skip unhealthy upstreams automatically |
| CORS management | Configure once, applies everywhere |
| Response caching | TTL-based GET caching in Redis |
| IP allowlist/blocklist | CIDR range support |

### Phase 3 — Advanced (weeks 5–6)

| Feature | Description |
|---------|-------------|
| Load balancing | Round-robin, weighted, least-connections — multiple upstreams per route |
| A/B routing | Split traffic by percentage between versions — canary deployments |
| Request mirroring | Duplicate traffic to shadow service — test v2 with real traffic |
| WebSocket proxying | Pass WS connections through for real-time apps |
| Plugin system | npm-publishable middleware plugins — community builds features |
| Analytics dashboard | React UI with charts, latency graphs |
| Distributed tracing | Inject trace IDs, export to Jaeger |

---

## 03 / Database Schema

Six tables. Everything the gateway needs to route, authenticate, rate-limit, and log — with the data model to support analytics and multi-project management.

### `consumers`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | `gen_random_uuid()` |
| name | VARCHAR(100) | Human readable — "Health Monitor Service" |
| api_key_hash | VARCHAR(255) | bcrypt hashed — never store plaintext |
| scopes | TEXT[] | `['read', 'write', 'admin']` |
| is_active | BOOLEAN | Soft disable without deleting |
| created_at | TIMESTAMPTZ | `DEFAULT now()` |

### `routes`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| prefix | VARCHAR(255) | e.g. `/health` — UNIQUE, indexed |
| target_url | VARCHAR(500) | e.g. `http://localhost:4001` |
| strip_prefix | BOOLEAN | Remove `/health` before forwarding |
| auth_required | BOOLEAN | `false` for public routes |
| methods | TEXT[] | `['GET','POST']` — null = all methods |
| timeout_ms | INT | Per-route timeout — `DEFAULT 5000` |
| is_active | BOOLEAN | Toggle routes without deleting |

### `rate_limit_rules`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| route_id | UUID FK | → routes.id (null = global rule) |
| consumer_id | UUID FK | → consumers.id (null = all consumers) |
| max_requests | INT | e.g. 100 |
| window_secs | INT | Rolling window — e.g. 60 |

### `request_logs`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGSERIAL PK | High-write table — bigserial not uuid |
| route_id | UUID FK | → routes.id |
| consumer_id | UUID FK | → consumers.id |
| method | VARCHAR(10) | GET, POST, etc. |
| path | TEXT | Full request path |
| status_code | INT | Response status |
| latency_ms | INT | Gateway-measured round trip |
| ip | INET | Client IP — Postgres native type |
| created_at | TIMESTAMPTZ | Indexed DESC for analytics queries |

### `circuit_breaker_state`

| Column | Type | Notes |
|--------|------|-------|
| target_url | VARCHAR(500) PK | One row per upstream |
| state | VARCHAR(12) | closed \| open \| half-open |
| failure_count | INT | Resets when state → closed |
| last_failure_at | TIMESTAMPTZ | |
| opens_at | TIMESTAMPTZ | When half-open probe fires |

### Index strategy for `request_logs`

```sql
CREATE INDEX ON request_logs (route_id, created_at DESC);
CREATE INDEX ON request_logs (consumer_id, created_at DESC);
```

Analytics queries filter by both. Without these, every dashboard query is a full table scan.

---

## 04 / Structure

Monorepo layout with separate packages for core, CLI, dashboard, and SDK. This makes it easy for contributors to work on one part without breaking others.

```
conduit/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── workflows/
│   │   ├── ci.yml              # Tests + lint on every PR
│   │   ├── release.yml         # Auto publish npm + Docker Hub
│   │   └── docs.yml            # Auto deploy Docusaurus
│   └── PULL_REQUEST_TEMPLATE.md
│
├── packages/                   # Monorepo — managed with npm workspaces
│   ├── core/                   # The gateway itself (MIT)
│   │   └── src/
│   │       ├── middleware/
│   │       │   ├── rateLimiter.ts
│   │       │   ├── authVerifier.ts
│   │       │   ├── requestTransformer.ts
│   │       │   └── requestLogger.ts
│   │       ├── proxy/
│   │       │   ├── router.ts
│   │       │   ├── forwarder.ts
│   │       │   └── circuitBreaker.ts
│   │       ├── admin/
│   │       │   ├── routes.ts
│   │       │   ├── consumers.ts
│   │       │   └── analytics.ts
│   │       └── plugins/
│   │           ├── redis.ts
│   │           ├── postgres.ts
│   │           └── queue.ts
│   ├── cli/                    # `conduit` CLI — start, plugin add, status
│   ├── dashboard/              # React + Vite admin UI
│   └── sdk/                    # JS client SDK (add Python later)
│
├── examples/                   # Critical — people copy these
│   ├── basic-setup/
│   ├── with-auth/
│   ├── docker-compose/
│   └── kubernetes/
│
├── docs/                       # Docusaurus site — deploy to Vercel free
│   ├── getting-started.md
│   ├── configuration.md
│   ├── plugins.md
│   └── deployment/
│       ├── docker.md
│       ├── railway.md
│       └── vps.md
│
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE                     # MIT
└── README.md                   # Your landing page — treat it like one
```

### Current structure

```
conduit-gateway/
├── apps/
│   ├── web/          # Admin dashboard (Next.js, port 3000)
│   └── docs/         # Documentation site (Next.js, port 3001)
├── packages/
│   ├── core/         # Gateway engine (Fastify, Prisma, Redis, BullMQ)
│   ├── ui/           # Shared React component library
│   ├── eslint-config/# Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
```

---

## 05 / Plugin System

A great plugin system means the community builds features for you. Look at how Fastify and ESLint grew — plugins made them ecosystems. Design yours to be dead simple to write and publish.

> This is the most important architecture decision you'll make. Every hour you spend designing the plugin API saves 10 hours of contributors being confused. Copy Fastify's pattern — it works.

### What a plugin looks like

```ts
// conduit-plugin-custom-auth.ts — npm publishable
import { definePlugin } from '@conduit/core'

export default definePlugin({
  name: 'custom-auth',
  version: '1.0.0',

  // Runs before the request is forwarded
  async onRequest(ctx, next) {
    const token = ctx.headers['x-api-key']
    if (!token || !isValid(token)) {
      return ctx.reply.code(401).send({ error: 'Unauthorized' })
    }
    ctx.state.userId = decode(token).sub   // pass data to next plugins
    await next()
  },

  // Runs after response received from upstream
  async onResponse(ctx, next) {
    ctx.reply.header('x-served-by', 'conduit')
    await next()
  }
})
```

### Installing plugins

```sh
# Via CLI
conduit plugin add conduit-plugin-custom-auth

# Or in conduit.yml
plugins:
  - conduit-plugin-custom-auth
  - conduit-plugin-request-id
  - conduit-plugin-gzip
```

### Plugin tiers

| Tier | Description |
|------|-------------|
| **Official plugins** | You maintain these. JWT auth, rate limiter, request logger, CORS, gzip compression, IP filter. |
| **Community plugins** | The community builds these. Datadog tracing, Sentry errors, Slack alerts, custom auth providers. |
| **Private plugins** | Users write these for their own needs. Not published. Just works. The killer self-host use case. |

---

## 06 / Open Source Strategy

The most proven open source business model. Kong, Grafana, GitLab, HashiCorp all used this exact playbook. Give away the core. Charge for the cloud-hosted version and enterprise features.

### Free forever (MIT)

- Core gateway + all middleware
- Plugin system
- Admin API
- React dashboard
- Docker image
- All examples + docs
- CLI tool
- Self-hostable on any server

### Cloud / enterprise (paid)

- Managed hosting (you run it)
- SSO / SAML login
- Team management + roles
- Advanced analytics
- Alerting + on-call
- Audit logs (compliance)
- SLA + priority support
- Custom plugin marketplace

### License

- **MIT** — for the core. Anyone can use, fork, modify, embed commercially. No restrictions. Maximum adoption. This is what puts you on the map.
- **BSL 1.1** — for cloud features. Free for non-production use. Requires a license for running as a cloud service. Converts to MIT after 4 years. This is how you monetize.

### Competitors

| Product | Setup time | Self-host | Free core | Simple config | Developer-first |
|---------|-----------|-----------|-----------|---------------|----------------|
| **Conduit (yours)** | **2 min** | **✓** | **✓** | **✓** | **✓** |
| Kong Gateway | 2+ hours | ✓ | ✓ | ✗ | ✗ |
| AWS API Gateway | 30 min | ✗ | ✗ | ✗ | ✗ |
| Traefik | 20 min | ✓ | ✓ | ✓ | ✗ |
| Apache APISIX | 1+ hour | ✓ | ✓ | ✗ | ✗ |

> Your unfair advantage: authenticity. You're building this while using it for real projects. Every pain point becomes a feature. Kong and AWS are built by teams who don't use their own products the way indie developers do. "I built this for myself" is the best marketing copy you can write.

---

## 07 / Launch Plan

Most open source projects die with 3 stars. These are the exact posts, in the exact order, that move the needle. Don't post everything at once — space it out.

### Week 1 — prep (before any posting)

**Day 1–3** — Polish the repo
- Working Docker image on Docker Hub
- Docs site live on Vercel (Docusaurus free)
- 5 example projects
- README GIF recorded

**Day 4–7** — Write the launch article
- "I built an open source API Gateway in Node.js — here's what I learned."
- Technical, honest, shows code. Post on dev.to first to index it.

### Week 2 — the launch sprint

| Day | Channel | Content |
|-----|---------|---------|
| 1 | dev.to | "I built a lightweight API Gateway — open source, self-hosted, 2-minute setup." |
| 3 | Reddit | Custom posts for r/node, r/selfhosted, r/webdev |
| 5 | Hacker News | "Show HN: Conduit – a lightweight self-hosted API gateway" (post 9am ET weekday) |
| 7 | Twitter/X | Thread: hook + GIF → problem → how it works → GitHub link |
| 10 | ProductHunt | Schedule Tuesday or Wednesday, ask friends to upvote |

### Ongoing — what sustains growth

| Frequency | Activity |
|-----------|----------|
| Monthly | Comparison content: "Conduit vs Kong", "Replace AWS API Gateway with this open source alternative" |
| Weekly | Answer Stack Overflow questions about API gateways, rate limiting, JWT proxying |
| Ongoing | Build in public — tweet progress with code snippets |

---

## 08 / Success Metrics

Month 3 targets:

| Metric | Target | Why |
|--------|--------|-----|
| GitHub stars | 500 | Credibility threshold |
| npm downloads/week | 50 | Real usage signal |
| Contributors | 5 | Project health signal |
| GitHub issues | 20+ | Shows real usage |
| Docker pulls | 1k | Production deployments |
| Discord members | 100 | Community health |

---

## 09 / Build Order

Don't build everything before shipping. Ship early, get real users, let their issues guide what you build next.

| Phase | Timeline | What to build |
|-------|----------|---------------|
| W1 | Week 1 | Basic proxy + route table + admin CRUD. HTTP forwarding, Postgres route table, add/remove routes via API. Docker image published. This alone is useful. |
| W2 | Week 2 | Rate limiter + auth verifier. Redis token bucket rate limiting. JWT verification. Now it's actually a gateway, not just a proxy. |
| W3 | Week 3 | Circuit breaker + request logging. Open/half-open/closed state machine. Async logging via BullMQ. Now it's production-ready. |
| W4 | Week 4 | Open source launch. README GIF, docs site, 5 examples, Docker Hub image. HN Show HN post. This is the milestone, not an afterthought. |
| W5 | Week 5 | Plugin system + React dashboard. The plugin API. A React dashboard showing routes, traffic, latency. This is what makes people share it. |
| W6+ | Week 6+ | Let issues guide you. Load balancing, A/B routing, WebSocket support — build what your users are actually asking for. Not what you think they want. |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Docker (for PostgreSQL and Redis)

### Start services

```sh
docker compose up -d postgres redis
```

### Install dependencies

```sh
npm install
```

### Set up the database

```sh
npx prisma migrate dev
```

### Run in development

```sh
npm run dev
```

This starts all apps and packages in parallel — the gateway, admin dashboard, and docs.

### Build

```sh
npm run build
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all packages in dev |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run check-types` | Type-check all packages |
| `npm run format` | Format code with Prettier |

---

## Tech Stack

- [Fastify](https://fastify.dev/) — Gateway HTTP server
- [Next.js](https://nextjs.org/) — Frontend apps
- [Prisma](https://prisma.io/) — Database ORM
- [Redis](https://redis.io/) — Caching and job queues
- [BullMQ](https://bullmq.io/) — Message queue for request logging
- [Zod](https://zod.dev/) — Schema validation
- [Turborepo](https://turborepo.dev/) — Monorepo orchestration

---

Built by a developer, for developers.

Conduit Gateway — open source API gateway blueprint.

Auth system → API Gateway → Health Monitor → The entire platform
