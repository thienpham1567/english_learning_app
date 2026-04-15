# English Learning App

A full-stack English learning platform built with Next.js, featuring AI-powered dictionary, grammar analysis, flashcards, and more.

## Monorepo Structure

```
english_learning_app/
├── apps/
│   └── web/              # Next.js web application
│       ├── app/           # App router pages & API routes
│       ├── components/    # React components
│       ├── hooks/         # Custom React hooks
│       ├── lib/           # Shared utilities, DB, auth
│       ├── data/          # Static data files
│       ├── public/        # Static assets
│       ├── test/          # Test setup & helpers
│       └── drizzle/       # DB migrations
├── packages/              # Shared packages (future)
│   ├── shared/            # Error types, result helpers
│   ├── contracts/         # Zod schemas, DTOs
│   ├── database/          # Drizzle schema, query services
│   ├── auth/              # ActorContext, session resolution
│   └── modules/           # Domain modules (dashboard, etc.)
├── turbo.json             # Turborepo task config
├── pnpm-workspace.yaml    # Workspace definition
└── tsconfig.json          # Base TypeScript config
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10.28+
- PostgreSQL (via Supabase or local)

### Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example apps/web/.env.local
# Fill in your DATABASE_URL, OPENAI_API_KEY, etc.

# Run database migrations
pnpm db:migrate

# Start development
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages and apps |
| `pnpm test` | Run tests (watch mode) |
| `pnpm test:run` | Run tests once |
| `pnpm format` | Check formatting (Biome) |
| `pnpm format:fix` | Fix formatting |
| `pnpm check` | Run Biome checks |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run Drizzle migrations |
| `pnpm db:studio` | Open Drizzle Studio |

### Filtering

Run commands for a specific workspace:

```bash
pnpm build --filter web          # Build only the web app
pnpm test:run --filter web       # Test only the web app
pnpm dev --filter @repo/shared   # Dev a specific package
```

## Adding a New Package

```bash
# Create the package directory
mkdir -p packages/my-package/src

# Create package.json
cat > packages/my-package/package.json << 'EOF'
{
  "name": "@repo/my-package",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
EOF

# Create tsconfig.json
cat > packages/my-package/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
EOF

# Install from root
pnpm install
```

Then add `"@repo/my-package": "workspace:*"` to any app's `package.json` that needs it.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** Ant Design 6 + vanilla CSS
- **Database:** PostgreSQL + Drizzle ORM
- **Auth:** Better Auth
- **AI:** OpenAI GPT-4
- **Testing:** Vitest + Testing Library
- **Build:** Turborepo + pnpm workspaces
- **Formatting:** Biome
