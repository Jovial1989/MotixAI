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
├── mobile_flutter             # Flutter mobile app (iOS + Android)
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

Mobile (Flutter — primary):
```bash
cd mobile_flutter
flutter pub get
flutter run                  # pick device interactively
flutter run -d ios           # iOS Simulator
flutter run -d android       # Android Emulator
```

## Build

```bash
yarn build
```

## Docker (Backend + Postgres + Redis)

```bash
docker compose up --build
```

## Mobile Build (Flutter)

```bash
cd mobile_flutter
flutter build ipa            # iOS
flutter build apk            # Android
```

## Mobile Legacy (React Native / Expo — deprecated)

The legacy Expo app lives in `mobile_rn_legacy/` and is **not maintained**.
See `mobile_rn_legacy/DEPRECATED.md` for details.

To run locally for reference only:
```bash
cd mobile_rn_legacy
npm install
npx expo start               # Expo Go / emulator
npx expo start --tunnel      # if network issues
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
