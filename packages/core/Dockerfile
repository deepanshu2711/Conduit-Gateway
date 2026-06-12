FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc turbo.json ./

COPY packages/core/package.json packages/core/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/

RUN npm ci

COPY . .

WORKDIR /app/packages/core
RUN npx prisma generate && npx tsc -b

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core ./packages/core

EXPOSE 3000
CMD ["node", "packages/core/dist/server.js"]
