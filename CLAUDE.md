# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Yarn workspaces monorepo with four packages:

| Workspace | Package name | Port |
|-----------|-------------|------|
| `backend/` | `@hammerai/backend` | 4000 |
| `web/` | `@hammerai/web` | 3000 |
| `mobile/` | `@hammerai/mobile` | Expo |
| `packages/shared/` | `@hammerai/shared` | – |

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
yarn workspace @hammerai/backend test
yarn workspace @hammerai/web typecheck

# Database (run from backend/)
yarn workspace @hammerai/backend db:migrate   # prisma migrate dev
yarn workspace @hammerai/backend db:generate  # regenerate Prisma client
yarn workspace @hammerai/backend db:seed      # seed admin user
yarn workspace @hammerai/backend db:studio    # Prisma Studio UI
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

### Backend (`@hammerai/backend`)

Layered Express API: `routes → controllers → services → Prisma`.

- **Entry**: `src/index.ts` starts the server; `src/app.ts` configures Express (helmet, cors, rate-limit, morgan, routes, error handlers).
- **Routes**: `src/routes/index.ts` mounts `/auth`, `/users`, `/ai` under `API_PREFIX`.
- **Auth**: JWT with short-lived access tokens (15m) and refresh tokens (7d). The `authenticate` middleware validates Bearer tokens. `authorize(...roles)` guards role-based routes.
- **Validation**: Zod schemas in `src/validators/` are applied via the `validate` middleware before reaching controllers.
- **Error handling**: All async errors pass to `next(err)`. `AppError` (with a `statusCode`) is handled by `src/middleware/errorHandler.ts`; unmatched routes hit `notFoundHandler.ts`.
- **Database**: Singleton Prisma client in `src/config/database.ts` (avoids connection leaks in dev). Schema has two models: `User` (uuid PK, role enum) and `AiSession` (stores messages as JSON, cascades on User delete).
- **AI**: `src/services/ai.service.ts` is a placeholder — wire in `@anthropic-ai/sdk` there. The default model constant is `claude-sonnet-4-6`.
- **Logging**: Winston (`src/config/logger.ts`) — JSON in production, pretty-print in dev, files at `logs/`.

### Web (`@hammerai/web`)

Next.js 14 App Router with Tailwind CSS.

- **Routing**: File-based under `src/app/`. Route groups: `(auth)` for public auth pages, `dashboard/` for protected pages.
- **Layout**: `src/app/layout.tsx` wraps everything in `ThemeProvider` (next-themes, class-based dark mode).
- **Protected layout**: `DashboardShell` composes `Sidebar` + `Header` + main content area. `Sidebar` uses `usePathname` for active state.
- **State**: Zustand store at `src/store/authStore.ts` (persisted to localStorage). Holds `user` and `accessToken`.
- **API calls**: `src/lib/apiClient.ts` — Axios instance. Request interceptor injects the Bearer token from Zustand; response interceptor auto-logs out on 401.
- **Forms**: react-hook-form + Zod via `@hookform/resolvers`.

### Mobile (`@hammerai/mobile`)

React Native + Expo SDK 51, file-based routing via Expo Router.

- **Entry**: `mobile/app/_layout.tsx` (root Stack navigator). `mobile/app/index.tsx` redirects to `/(tabs)` or `/login` based on auth state.
- **Tabs**: `app/(tabs)/` — Dashboard (`index`), AI Chat (`chat`), Profile (`profile`). Tab bar uses lucide-react-native icons.
- **State**: Zustand at `src/store/authStore.ts`. Tokens persisted in `expo-secure-store` (not localStorage). Includes a `rehydrate()` action to restore session on app start.
- **API client**: `src/lib/apiClient.ts` — Axios, base URL read from `expo-constants` (`app.json` → `extra.apiUrl`).

### Shared (`@hammerai/shared`)

Pure TypeScript package compiled to `dist/`. Must be built (`yarn workspace @hammerai/shared build`) before `web` or `mobile` can consume it in CI. Both `web` and `mobile` reference it as `"@hammerai/shared": "*"` via workspaces.

Exports: TypeScript types (`User`, `ApiResponse`, `PaginatedResponse`, `ChatMessage`, `AiSession`), constants (`AI_MODELS`, `ROLES`, `HTTP_STATUS`), and utilities (`isEmail`, `isStrongPassword`, `formatDate`, `truncate`).

## Key Patterns

- **AppError**: throw `new AppError(message, statusCode)` anywhere in backend services/controllers; the error handler picks it up automatically.
- **Route protection**: apply `authenticate` then `authorize('admin')` middleware on any route that needs RBAC.
- **Adding a new API resource**: create `routes/foo.routes.ts`, `controllers/foo.controller.ts`, `services/foo.service.ts`, mount in `routes/index.ts`.
- **Adding a new web page**: add a file under `web/src/app/`. Use `DashboardShell` as the layout wrapper for authenticated pages.
- **Adding a new mobile screen**: add a file under `mobile/app/` (or `mobile/app/(tabs)/` for tab screens). Expo Router picks it up automatically.
