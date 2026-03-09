# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

Yarn workspaces monorepo with the following packages:

| Workspace | Package name | Port |
|-----------|-------------|------|
| `backend/` | `@motixai/backend` | 4000 |
| `web/` | `@motixai/web` | 3000 |
| `packages/shared/` | `@motixai/shared` | – |
| `packages/api-client/` | `@motixai/api-client` | – |

**Mobile**: Flutter app at `mobile_flutter/`. Not a Yarn workspace — use Flutter CLI directly.
**Legacy**: `mobile_rn_legacy/` contains the deprecated React Native/Expo app. Do not use.

All commands can be run from the root or scoped to a workspace with `yarn workspace <name> <script>`.

## Common Commands

```bash
# Install all dependencies
yarn install

# Run dev servers
yarn dev:backend       # backend API (ts-node-dev, hot reload)
yarn dev:web           # Next.js dev server

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

### Mobile (`mobile_flutter/`)

Flutter app (iOS + Android). Not part of Yarn workspaces — managed with Flutter CLI.

- **Entry**: `lib/main.dart` → `lib/app/app.dart`
- **Routing**: `lib/app/router.dart` using `go_router`
- **State**: `flutter_riverpod`
- **Auth**: `flutter_secure_storage` for token persistence
- **API**: `dio` HTTP client. Base URL configured via environment.
- **Run**: `flutter run` from `mobile_flutter/`
- **Build iOS**: `flutter build ipa` from `mobile_flutter/`
- **Build Android**: `flutter build apk` from `mobile_flutter/`

### Shared (`@motixai/shared`)

Pure TypeScript package compiled to `dist/`. Must be built before `web` can consume it in CI.

### API Client (`@motixai/api-client`)

Typed HTTP client wrapping the backend REST API. Used by both web and mobile.

## MCP Integrations

### Figma MCP

The project has Figma MCP configured in `.mcp.json`. It uses the official `@figma/mcp` package via `npx`.

**Setup:**

1. Generate a Figma personal access token at **Figma → Settings → Security → Personal access tokens**. Ensure the token has `File content` (read) scope.
2. Export the token before starting Claude Code:
   ```bash
   export FIGMA_ACCESS_TOKEN=your_token_here
   ```
   Or add it to your shell profile (`~/.bashrc`, `~/.zshrc`).
3. Restart Claude Code — it will automatically pick up the Figma MCP server.

**What it enables:**

- Read Figma file content, components, and styles directly in Claude Code
- Reference Figma designs when building UI in the `web/` and `mobile/` workspaces
- Extract design tokens and component specs without leaving the editor

**Local overrides:** If you need to store MCP config locally (e.g., hardcode a token for testing), create `.mcp.local.json` — it is git-ignored.

## Key Patterns

- **Adding a new API resource**: create module in `backend/src/domain/` and controller in `backend/src/api/`.
- **Adding a new web page**: add a file under `web/src/app/`. Use dashboard layout classes for authenticated pages.
- **Adding a new mobile screen**: add a file under `mobile_flutter/lib/`. Register in `lib/app/router.dart`.
