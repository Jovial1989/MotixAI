# HammerAI

A full-stack AI-powered monorepo containing Web, Mobile, and Backend applications.

## Project Structure

```
HammerAI/
├── backend/          # Node.js + Express REST API
├── web/              # Next.js web application
├── mobile/           # React Native (Expo) mobile app
├── packages/
│   └── shared/       # Shared types, utilities & constants
├── tsconfig.base.json
└── package.json
```

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Backend  | Node.js, Express, TypeScript, Prisma    |
| Web      | Next.js 14, TypeScript, Tailwind CSS    |
| Mobile   | React Native, Expo, TypeScript          |
| Shared   | TypeScript                              |
| Database | PostgreSQL (via Prisma ORM)             |
| Auth     | JWT (access + refresh tokens)           |

## Getting Started

### Prerequisites
- Node.js >= 20
- Yarn >= 1.22
- PostgreSQL (for backend)

### Install dependencies
```bash
yarn install
```

### Environment setup
```bash
cp backend/.env.example backend/.env
cp web/.env.example web/.env.local
cp mobile/.env.example mobile/.env
```

### Run development servers

```bash
# Backend API (port 4000)
yarn dev:backend

# Web app (port 3000)
yarn dev:web

# Mobile app (Expo)
yarn dev:mobile
```

### Build for production
```bash
yarn build
```

## Scripts

| Command           | Description                  |
|-------------------|------------------------------|
| `yarn dev:backend`| Start backend in watch mode  |
| `yarn dev:web`    | Start Next.js dev server     |
| `yarn dev:mobile` | Start Expo dev server        |
| `yarn build`      | Build backend + web          |
| `yarn lint`       | Lint all workspaces          |
| `yarn test`       | Run all tests                |
| `yarn typecheck`  | TypeScript check all         |
