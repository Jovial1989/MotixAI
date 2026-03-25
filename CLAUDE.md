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

**Mobile (primary)**: Flutter app at `mobile_flutter/`. Not a Yarn workspace — use Flutter CLI directly.
**Legacy (do not use)**: `mobile_rn_legacy/` contains the deprecated React Native/Expo app. It is not maintained and not part of any active workflow. Do not add code to it, do not run it in CI, and do not treat it as the mobile app.

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

### Mobile — Flutter (primary) (`mobile_flutter/`)

Flutter app (iOS + Android). Not part of Yarn workspaces — managed with Flutter CLI.

- **Entry**: `lib/main.dart` → `lib/app/app.dart`
- **Routing**: `lib/app/router.dart` using `go_router`
- **State**: `flutter_riverpod`
- **Auth**: `flutter_secure_storage` for token persistence
- **API**: `dio` HTTP client. Base URL configured via `dart_defines.env`.
- **Run**: `flutter run` from `mobile_flutter/`
- **Run iOS Simulator**: `flutter run -d ios` from `mobile_flutter/`
- **Run Android Emulator**: `flutter run -d android` from `mobile_flutter/`
- **List devices**: `flutter devices`
- **Build iOS**: `flutter build ipa` from `mobile_flutter/`
- **Build Android**: `flutter build apk` from `mobile_flutter/`

### Mobile — React Native / Expo (legacy, deprecated) (`mobile_rn_legacy/`)

**Do not use for new development.** This is a frozen legacy codebase.

- Not a Yarn workspace — has its own `node_modules/` and `package-lock.json`
- Not deployed or maintained
- Expo Go / Expo SDK only applies to this directory
- To run locally for reference: `cd mobile_rn_legacy && npm install && npx expo start`

### Shared (`@motixai/shared`)

Pure TypeScript package compiled to `dist/`. Must be built before `web` can consume it in CI.

### API Client (`@motixai/api-client`)

Typed HTTP client wrapping the backend REST API. Used by both web and mobile.

## MCP Integrations

### Figma MCP

The project has Figma MCP configured in the repo-level `.mcp.json`. The workspace uses `npx` to start the Figma MCP server for local editor clients.

**Setup:**

1. Generate a Figma personal access token at **Figma → Settings → Security → Personal access tokens**. Ensure the token has `File content` (read) scope.
2. Copy the local example file and paste your real key there:
   ```bash
   cp .env.mcp.local.example .env.mcp.local
   ```
   Then edit `.env.mcp.local` and replace the placeholder value for:
   ```bash
   FIGMA_API_KEY=PASTE_YOUR_KEY_HERE
   ```
3. Load the variable into your shell before starting Codex / Claude Code:
   ```bash
   export $(grep -v '^#' .env.mcp.local | xargs)
   ```
   Or add the same variable to your shell profile (`~/.bashrc`, `~/.zshrc`).
4. Restart Codex / Claude Code so the MCP client reloads `.mcp.json`.

**What it enables:**

- Read Figma file content, components, and styles directly in Claude Code
- Reference Figma designs when building UI in the `web/` and `mobile/` workspaces
- Extract design tokens and component specs without leaving the editor

**Local overrides:** If you need a local-only MCP override, create `.mcp.local.json` — it is git-ignored.

## Key Patterns

- **Adding a new API resource**: create module in `backend/src/domain/` and controller in `backend/src/api/`.
- **Adding a new web page**: add a file under `web/src/app/`. Use dashboard layout classes for authenticated pages.
- **Adding a new mobile screen**: add a file under `mobile_flutter/lib/`. Register in `lib/app/router.dart`.
