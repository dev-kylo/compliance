# UKRI Compliance

A pnpm monorepo for the UKRI Compliance application.

## Structure

```
├── apps/
│   └── ukri/          # Next.js 15 application (TypeScript, Tailwind v4)
├── packages/          # Shared packages (future)
├── eslint.config.mjs  # Global ESLint flat config
├── tsconfig.json      # Base TypeScript config
├── .prettierrc        # Prettier config
└── pnpm-workspace.yaml
```

## Commands

```bash
pnpm dev          # Start ukri dev server
pnpm build        # Build ukri
pnpm lint         # Lint all workspaces
pnpm typecheck    # TypeScript check all workspaces
pnpm format       # Format with Prettier
pnpm format:check # Check formatting
```

## Conventions

- **TypeScript**: Strict mode enabled. All new code must be TypeScript.
- **Styling**: Use Tailwind CSS utility classes. No CSS modules or styled-components.
- **ESLint**: Flat config (v9). Extends from root config in each workspace.
- **Prettier**: Runs on save. Tailwind plugin auto-sorts classes.

## Adding Packages

Shared packages go in `packages/`. Each package should:
1. Have its own `package.json` with `name` field
2. Extend root `tsconfig.json`
3. Include a `lint` script for workspace-wide linting
