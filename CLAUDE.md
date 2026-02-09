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


# Repo-wide coding standards

- Use `camelCase` for function and identifier names, `PascalCase` for types and React component names, `ALL_CAP` for
  true constants. Directory and file names should generally be `camelCase`, except for React component names.
- Whenever possible, provide types to arguments and return values for functions. If the types and function names are
  self-descriptive, there is no need to provide JSDoc. If the arguments need some explanation, explain them within the
  type definitions. The type definitions can be inline, but if they are used usewhere, use the convention:
  FunctionNameParams for the argument type, and FunctionNameReturn for the return type.
- Try to keep the complexity and length of each function low. As a soft rule, if a function is over 100 lines long, it
  should be split up. Do not export the functions that are being split up if they are not used outside.
- Try to keep the complexity and length of each file low. As a soft rule, if a file is over 800 lines long, it should be
  split up.
- If you introduce a function that is generic enough, not coupled to the context it is in, consider move it to a shared
  place.
- Use one-line for the if-return pattern.
- Avoid re-exporting if possible, unless it's an index file that exposes the public interface of a module, where you can
  re-export from other files in the module.
- Destructure params in the function signature, not the body, unless you need the params object itself.
- Do NOT use OOP-style (defining a class) unless you have a good reason to. Our codebase is mainly non-OOP, so when a reader sees a class, they need to stop and think why you did it that way. Good use cases: adapting to an API that requires a class, or the problem can be cleanly modeled by using OOP style.
- Use absolute imports if relative imports are >= 3 levels deep.
- Default to named arguments for all exported functions. Local unexported helpers are allowed to use positional arguments. The only other exception is if there is only one argument and it's super obvious what the argument is. For example, `maxElement(array: T[])`.
- Avoid deeply indented code. At 5 levels of indentation, that's when you should refactor.
