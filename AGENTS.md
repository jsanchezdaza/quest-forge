# AGENTS.md

Working agreements for every coding agent in this repo. `CLAUDE.md` is the longer architecture note. There is no `.cursorrules` file and no `.cursor/rules` directory.

## Principles

Use Extreme Programming, lean software development, and a product mindset. Favor sound practices and architecture patterns when they are the simplest way to meet the acceptance criteria. Apply YAGNI: add no abstraction the issue does not need. Keep the diff minimal and scoped to that issue.

Reuse the components, stores, utilities, and file layout already in the tree. TypeScript is strict (`strict`, `noUnusedLocals`, and `noUnusedParameters` in `tsconfig.json`). Keep balance numbers in `src/constants/game.ts` and `src/utils/levelSystem.ts`.

## Test-driven development

Write a failing test, make it pass, then refactor. Cover every acceptance criterion:

- Domain and API behavior: `pnpm test:unit` (`node --test api/*.test.ts tests/unit/*.test.ts`). Handler tests sit next to `api/`; other unit tests live in `tests/unit/`.
- User-facing behavior: Playwright specs in `tests/e2e/`.

Keep tests deterministic. Mock dates and clocks. Do not hard-code the current year.

Playwright loads `tests/e2e/setup.ts`, which supplies mock `VITE_SUPABASE_*` values when unset and sets `window.mockSupabaseAuth`. Production code reads that flag only through `src/lib/testMode.ts` (auth init, sign-out, and game-session loads). Specs must run without real Supabase credentials. Stub a specific Auth HTTP result in the spec that needs it, as `auth-a11y.spec.ts` does.

Query the UI with `getByRole` and `getByLabel`, as the auth specs do. `tests/e2e/auth-a11y.spec.ts` runs `@axe-core/playwright` for contrast (`wcag143`) and ARIA (`cat.aria`) and must stay green.

`playwright.config.ts` defines desktop Chromium (`chromium`, Desktop Chrome) and `Mobile Chrome` (Pixel 5), plus Firefox, WebKit, Mobile Safari, and Tablet. CI (`.github/workflows/ci.yml`, 10-minute timeout) runs `auth.spec.ts` and `auth-a11y.spec.ts` on `chromium` and `Mobile Chrome` only. Run one file with `pnpm exec playwright test tests/e2e/auth.spec.ts --project=chromium`. Run the other specs your change touches; they are not all in CI.

## Commits

Small commits, one logical change each, with a clear English message. Use Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). No AI attribution and no `Co-authored-by` trailers. Read the diff before committing and simplify it.

## Language

English for everything pushed: code, comments, commits, pull requests, issues, and docs. Keep UI copy in sync in `src/i18n/en.ts` and `src/i18n/es.ts`. `en` owns the keys; `es` is typed as `typeof en`, so a missing or extra key fails the typecheck. Components call `useTranslation`; other modules call `translate`. Both come from `src/i18n`.

## Project conventions

Use pnpm only (Node >= 24, pnpm >= 11, lockfile `pnpm-lock.yaml`). Install with `pnpm install --frozen-lockfile`.

`pnpm check`, which `.agents/check` executes, runs in order:

1. `pnpm test:unit`
2. `pnpm type-check:api` (`tsc -p tsconfig.api.json`)
3. `pnpm lint` (ESLint on `src/**/*.{ts,tsx}`, `--max-warnings 0`)
4. `pnpm build` (`tsc && vite build`: app typecheck, then the production bundle)

`pnpm test:e2e` is separate. CI lints, builds, and runs the auth end-to-end specs above. It does not run `pnpm test:unit`.

Stack in this repo: React 19, TypeScript, Vite, React Router v7, Zustand, Tailwind CSS, and Supabase Auth. Stores in `src/store/`: `authStore.ts` (session and profile), `gameStore.ts` (session, scenes, mutations), `languageStore.ts` (`en` or `es`). Components subscribe to them directly. Supabase client and schema types are in `src/lib/supabase.ts`. `src/App.tsx` sends signed-out users to `/auth` and signed-in users to `/game`.

Text fields use `src/components/ui/Input.tsx` (label, error, helper text, and the matching `aria-*` attributes). The auth form already uses it. Multiline text uses the existing `Textarea`.

Optional narrative goes from `src/lib/openrouter.ts` through `api/openrouter.ts`. `OPENROUTER_API_KEY` is server-only and must not use the `VITE_` prefix. `VITE_OPENROUTER_ENABLED=false` forces `src/lib/narrative.ts`. Local config belongs in `.env.local` (see `.env.example`). Do not commit credentials, `dist/`, Playwright reports, or test results.

## Definition of done

Lint, typecheck, unit tests, and the relevant end-to-end specs pass locally (`pnpm check` and `pnpm test:e2e`, or the specs and projects you changed, including `auth-a11y.spec.ts` when the auth UI changes). Open a pull request against `main` with `Closes #N`. Leave it unmerged. The repo owner reviews and merges.

## Product

User stories come from the product manager. Design comes from the product designer. When an acceptance criterion is ambiguous, state the assumption in the pull request description and implement that. Stay inside the issue.
