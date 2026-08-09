# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use `pnpm` for everything (see Package Manager below).

- `pnpm dev` — Vite dev server at http://localhost:5173
- `pnpm build` — `tsc && vite build` (type-checks, then builds)
- `pnpm lint` — `eslint "src/**/*.{ts,tsx}" --max-warnings 0` (zero-warning policy; CI fails on any warning)
- `pnpm test:unit` — Node.js unit tests for serverless APIs and domain utilities
- `pnpm test:e2e` — Playwright end-to-end tests
- `pnpm check` — unit tests, API type checks, lint, and production build

Running a subset of e2e tests:
- Single file: `pnpm exec playwright test tests/e2e/auth.spec.ts`
- By test name: `pnpm exec playwright test -g "should display auth form"`
- Single browser: `pnpm exec playwright test --project=chromium tests/e2e/auth.spec.ts`

Playwright config lives in `playwright.config.ts`; specs in `tests/e2e/`. Supabase is mocked in
`tests/e2e/setup.ts`, so e2e runs without real credentials. CI (`.github/workflows/ci.yml`) currently
runs **only** `auth.spec.ts` on chromium with a 10-minute timeout — broader specs exist but are not yet in CI.

## Architecture

Quest Forge is a narrative D&D game: a player creates a character (one of 6 classes with distinct
starting stats), progresses through choice-driven story scenes, and gains XP to level up and allocate
attribute points.

**Stack**: React 19 + TypeScript + Vite, React Router v7 (`/auth`, `/game`, `/`), Tailwind CSS
(custom medieval theme), Supabase (auth + Postgres), OpenRouter (optional AI narrative).

**State — Zustand, not Redux.** (Note: the global `~/.claude` instructions reference RTK/Redux Toolkit;
this project does **not** use it.) Three stores in `src/store/`, subscribed to directly by components
(no prop drilling):
- `authStore.ts` — logged-in user + profile; wired to Supabase's `onAuthStateChange` listener.
- `gameStore.ts` — current session, scenes array, and all game mutations (`createSession`, `makeChoice`, …).
  This is where the core game logic lives.
- `notificationStore.ts` — toast queue.

**Persistence**: game mutations write straight to Supabase. Each choice appends a new immutable row to
the `scenes` table and updates the `game_state` JSON column on `game_sessions`. Tables: `user_profiles`,
`game_sessions`, `scenes` (RLS enabled). Client + schema types in `src/lib/supabase.ts`.

**Narrative is dual-mode**: `src/lib/openrouter.ts` sends authenticated requests to the
`api/openrouter.ts` serverless proxy, which keeps `OPENROUTER_API_KEY` out of the browser. Set
`VITE_OPENROUTER_ENABLED=false` to force static narratives from `src/lib/narrative.ts`. Streaming
updates `streamingNarrative` in the store via an `onChunk` callback.

**Level system**: `src/utils/levelSystem.ts` plus `src/constants/game.ts` hold all tunable balance
numbers (XP per level, attribute/health gains, starting stats). `src/hooks/useLevelUp.ts` drives the
level-up modal where the player distributes points across the 6 attributes.

**Entry & routing**: `src/main.tsx` → `src/App.tsx` (BrowserRouter + auth-guard redirect:
unauthenticated → `/auth`, authenticated → `/game`) → `src/pages/{AuthPage,GamePage}.tsx`.
`GamePage` loads the latest session on mount and shows the character-creation modal when none exists.

**Local env**: create `.env.local` with browser-safe `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `OPENROUTER_API_KEY`
server-side for the proxy (see `.env.example`).

# Development Guidelines for Quest Forge

## Package Manager

**ALWAYS use pnpm** - Never use npm or yarn
- Commands: `pnpm install`, `pnpm dev`, `pnpm build`
- Lock file: `pnpm-lock.yaml`

## Git Commit Guidelines

**NO CO-AUTHOR references** - Never add "Co-authored-by: Claude" or similar
- NO AI references in commit messages
- Write commits as if made by a human developer
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`

### Examples:
✅ `feat: add character creation form`
✅ `fix: resolve auth redirect issue`
✅ `chore: update dependencies`
❌ `feat: add character creation (with Claude assistance)`
❌ `Co-authored-by: Claude <claude@anthropic.com>`

## Lean & XP Principles (MANDATORY)

- **Simplest thing that works** - No over-engineering
- **YAGNI (You Aren't Gonna Need It)** - Don't add features not explicitly requested
- **Small iterations** - Implement minimal viable version first
- **Refactor continuously** - Clean code as you go
- **Test-Driven Development (TDD)** - ALWAYS write tests first, then implementation
  - Red: Write a failing test
  - Green: Write minimal code to pass
  - Refactor: Clean up while keeping tests green
- **User stories first** - Always think "As a player, I want to..."

## Pre-Commit Refactor Check (MANDATORY)

**BEFORE every commit, perform a refactor assessment:**

1. **Code Quality Check**
   - Are there any duplicated patterns in the new code?
   - Can any new components/functions be simplified or extracted?
   - Are there magic numbers or hardcoded strings that should be constants?
   - Is the code following existing patterns and conventions?

2. **Performance & Maintainability**
   - Are there unnecessary re-renders or expensive operations?
   - Can any complex logic be broken down into smaller functions?
   - Are TypeScript types properly defined (no `any` usage)?
   - Is error handling consistent across similar components?

3. **Testing & Documentation**
   - Do the changes maintain existing test coverage?
   - Are new utilities/components covered by tests if critical?
   - Is the code self-documenting or does it need comments?

4. **Integration Review**
   - Does the new code integrate well with existing components?
   - Are there opportunities to reuse existing utilities/components?
   - Does it follow the established file structure and naming conventions?

**If any refactoring is needed, do it BEFORE the commit. Keep the commit focused and clean.**

## Pre-Commit File Review (MANDATORY)

**ALWAYS show all modified files before committing to git:**
- Use `git status` and `git diff` to show exactly what will be committed
- Display the changes clearly so the user can review them
- Only proceed with the commit after showing the file changes
- This ensures transparency and allows for final review before version control