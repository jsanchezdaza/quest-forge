# Repository Guidelines

## Project Overview

Quest Forge is a narrative D&D game built with React 19, TypeScript, Vite, React Router, Tailwind CSS, Zustand, Supabase, and optional OpenRouter narrative generation. Use `pnpm` exclusively. The required toolchain is Node 24 or newer and pnpm 11 or newer.

## Commands

- `pnpm install --frozen-lockfile` installs the locked dependencies.
- `pnpm dev` starts the Vite development server.
- `pnpm lint` runs ESLint with zero warnings allowed.
- `pnpm build` type-checks and creates the production bundle.
- `pnpm test:unit` runs the serverless API unit tests.
- `pnpm test:e2e` runs the Playwright suite.
- `pnpm exec playwright test tests/e2e/auth.spec.ts` runs one spec.
- `pnpm check` runs unit tests, API type checks, lint, and the production build.

Run `pnpm check` before considering a change complete. Run the relevant Playwright specs for behavior changes; CI currently runs the Chromium authentication spec.

## Architecture

Application code lives in `src/`. Pages and routing begin in `src/main.tsx` and `src/App.tsx`; route-level UI is in `src/pages/`. Shared state belongs in the Zustand stores under `src/store/`, not Redux or prop-drilling. Supabase integration and schema types live in `src/lib/supabase.ts`. Game mutations persist sessions and immutable scenes through the game store. Static fallback narrative lives in `src/lib/narrative.ts`; optional streamed AI narrative lives in `src/lib/openrouter.ts`. Keep level calculations and balance values in `src/utils/levelSystem.ts` and `src/constants/game.ts`.

## Engineering Practices

Work in small, independently shippable steps. Follow TDD: reproduce behavior with a failing test, implement the simplest passing change, then refactor under green. Prefer established components, stores, utilities, and file structure over new abstractions. Keep TypeScript strict and do not introduce `any`, warning suppressions, unnecessary re-renders, duplicated game logic, or hard-coded balance values.

Playwright specs live in `tests/e2e/`; Supabase is mocked in `tests/e2e/setup.ts`, so browser tests must not require real credentials. Serverless API unit tests live beside their handlers under `api/`. Add or update the closest behavioral test for every behavior change.

## Environment and Security

Local configuration belongs in `.env.local`. Browser-safe variables use the `VITE_` prefix. OpenRouter requests go through the authenticated serverless proxy; `OPENROUTER_API_KEY` is server-only and must never use the `VITE_` prefix. Never commit credentials, generated `dist/`, Playwright reports, or test results.

## Git

Use focused Conventional Commits such as `feat:`, `fix:`, `chore:`, and `docs:`. Do not add AI attribution or co-author footers. Before committing, inspect every modified file, assess whether the change can be simplified, and confirm the relevant checks have passed.
