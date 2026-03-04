# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Yarn workspaces monorepo with four packages:

| Workspace | Package name | Port |
|-----------|-------------|------|
| `backend/` | `@motixai/backend` | 4000 |
| `web/` | `@motixai/web` | 3000 |
| `mobile/` | `@motixai/mobile` | Expo |
| `packages/shared/` | `@motixai/shared` | – |

All commands can be run from the root or scoped to a workspace with `yarn workspace <name> <script>`.

## Common Commands

```bash
# Install all dependencies
yarn install

# Run dev servers
yarn dev:backend       # backend API (ts-node-dev, hot reload)
yarn dev:web           # Next.js dev server
yarn dev:mobile        # Expo dev server

# Build
yarn build             # builds backend + web
yarn build:backend
yarn build:web

# Lint / typecheck / test (all workspaces)
yarn lint
yarn typecheck
yarn test

# Single workspace
yarn workspace @motixai/backend test
yarn workspace @motixai/web typecheck

# Database (run from backend/)
yarn workspace @motixai/backend db:migrate   # prisma migrate dev
yarn workspace @motixai/backend db:generate  # regenerate Prisma client
yarn workspace @motixai/backend db:seed      # seed admin user
yarn workspace @motixai/backend db:studio    # Prisma Studio UI
```

## Environment Setup

Each workspace has a `.env.example`. Copy to the appropriate file before running:

```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
cp mobile/.env.example mobile/.env
```

Key backend env vars: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT` (4000), `API_PREFIX` (/api/v1).

## Architecture

### Backend (`@motixai/backend`)

NestJS API with Prisma ORM.

- **Entry**: `src/main.ts` bootstraps NestJS; `src/app.module.ts` wires modules.
- **Auth**: JWT with short-lived access tokens (15m) and refresh tokens (7d). Guards protect routes.
- **Validation**: Zod schemas in `src/api/*/schemas.ts`.
- **Database**: Prisma client with PostgreSQL. Schema in `prisma/schema.prisma`.
- **AI**: `src/ai/gemini.provider.ts` for text, `src/ai/gemini-image.provider.ts` for step images.
- **Jobs**: BullMQ queues for async image generation per repair step.

### Web (`@motixai/web`)

Next.js 14 App Router with custom CSS.

- **Routing**: File-based under `src/app/`. Auth pages under `src/app/auth/`, dashboard under `src/app/dashboard/`.
- **API calls**: `src/lib/api.ts` — uses `@motixai/api-client`.
- **Styles**: Custom CSS design system in `src/app/globals.css`.

### Mobile (`@motixai/mobile`)

React Native + Expo SDK 54, file-based routing via Expo Router.

- **Entry**: `app/_layout.tsx` (root Stack navigator). `app/index.tsx` is the dashboard.
- **State**: Zustand at `src/store/authStore.ts`. Tokens persisted in `expo-secure-store`.
- **API client**: `src/lib/api.ts` — uses `@motixai/api-client`. Base URL from `EXPO_PUBLIC_API_URL`.
- **Android emulator**: use `http://10.0.2.2:4000` or local network IP for API URL.
- **iOS simulator**: use `http://localhost:4000` or local network IP for API URL.

### Shared (`@motixai/shared`)

Pure TypeScript package compiled to `dist/`. Must be built before `web` or `mobile` can consume it in CI.

### API Client (`@motixai/api-client`)

Typed HTTP client wrapping the backend REST API. Used by both web and mobile.

## Key Patterns

- **Adding a new API resource**: create module in `backend/src/domain/` and controller in `backend/src/api/`.
- **Adding a new web page**: add a file under `web/src/app/`. Use dashboard layout classes for authenticated pages.
- **Adding a new mobile screen**: add a file under `mobile/app/`. Expo Router picks it up automatically.
