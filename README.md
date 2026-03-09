# MotixAI Monorepo

## Repository Structure

```
.
├── backend
│   ├── src
│   │   ├── api                # API layer (Nest controllers/modules)
│   │   ├── domain             # Domain layer (auth/guides/enterprise use cases)
│   │   ├── ai                 # AI layer (provider abstraction + Gemini providers)
│   │   ├── infrastructure     # Prisma/JWT/queue infrastructure
│   │   └── jobs               # Background workers (BullMQ)
│   ├── prisma
│   │   ├── schema.prisma
│   │   ├── migrations
│   │   └── seed.ts
│   └── Dockerfile
├── web                        # Next.js App Router web app
├── mobile                     # Expo React Native app
├── packages
│   ├── shared                 # Shared domain contracts/types
│   └── api-client             # Generated typed API client from OpenAPI contract
├── docs/openapi.yaml
└── docker-compose.yml
```

## Local Setup

1. Install dependencies:
```bash
yarn install
```

2. Create env files:
```bash
cp backend/.env.example backend/.env
cp .env.example .env
```

3. Start infrastructure:
```bash
docker compose up -d postgres redis
```

4. Generate Prisma client, migrate, seed:
```bash
yarn workspace /backend db:generate
yarn workspace /backend db:migrate
yarn workspace /backend db:seed
```

## Run Locally

Backend:
```bash
yarn dev:backend
```

Web:
```bash
cd web
NEXT_PUBLIC_API_URL=http://localhost:4000 yarn dev
```

Mobile (Expo latest SDK):
```bash
yarn dev:mobile
# press i for iOS simulator / a for Android emulator
```

## Build

```bash
yarn build
```

## Docker (Backend + Postgres + Redis)

```bash
docker compose up --build
```

## Mobile Build

1. Install EAS CLI:
```bash
npm i -g eas-cli
```

2. Login and configure project:
```bash
cd mobile
eas login
eas build:configure
```

3. Build development client:
```bash
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## Video Generation Extension Point

Video generation is intentionally not implemented.

Extension interface is defined in:
- `backend/src/ai/ai-provider.interface.ts` as `AIVideoProvider`

To add video generation later:
1. Create `GeminiVideoProvider` implementing `AIVideoProvider`.
2. Add a new background job type (e.g. `GUIDE_VIDEO_GENERATION`) in Prisma + BullMQ worker.
3. Persist produced storyboard/video artifacts in a dedicated table (e.g. `GeneratedVideo`).
4. Expose optional video fields in guide detail responses for web/mobile rendering.
