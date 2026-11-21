# AGENTS.md

Working agreements for every coding agent in this repo. `CLAUDE.md` is the longer architecture note. There is no `.cursorrules` file and no `.cursor/rules` directory.

## Principles

Use Extreme Programming, lean software development, and a product mindset. Favor sound practices and architecture patterns when they are the simplest way to meet the acceptance criteria. Apply YAGNI: add no abstraction the issue does not need. Keep the diff minimal and scoped to that issue.

Reuse the components, stores, utilities, and file layout already in the tree. TypeScript is strict (`strict`, `noUnusedLocals`, and `noUnusedParameters` in `tsconfig.json`). Keep balance numbers in `src/constants/game.ts` and `src/utils/levelSystem.ts`.

## Test-driven development

Write a failing test, make it pass, then refactor. Cover every acceptance criterion:

- Domain and API behavior: `pnpm test:unit` (`node --test api/*.test.ts tests/unit/*.test.ts`). Handler tests sit next to `api/`; other unit tests live in `tests/unit/`.
- User-facing behavior: Playwright specs in `tests/e2e/`. Coding agents write these specs and do not run them locally.

Keep tests deterministic. Mock dates and clocks. Do not hard-code the current year.

Playwright loads `tests/e2e/setup.ts`, which supplies mock `VITE_SUPABASE_*` values when unset and sets `window.mockSupabaseAuth`. Production code reads that flag only through `src/lib/testMode.ts` (auth init, sign-out, and game-session loads). Specs must run without real Supabase credentials. Stub a specific Auth HTTP result in the spec that needs it, as `auth-a11y.spec.ts` does.

Query the UI with `getByRole` and `getByLabel`, as the auth specs do. `tests/e2e/auth-a11y.spec.ts` runs `@axe-core/playwright` for contrast (`wcag143`) and ARIA (`cat.aria`) and must stay green in CI.

`playwright.config.ts` defines desktop Chromium (`chromium`, Desktop Chrome) and `Mobile Chrome` (Pixel 5), plus Firefox, WebKit, Mobile Safari, and Tablet. CI (`.github/workflows/ci.yml`) runs every spec under `tests/e2e/` on `chromium` and `Mobile Chrome` in 3 parallel Playwright shards (about 5 minutes), with a single required `e2e` gate job. Coding agents do not run Playwright locally, including a single file.

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

Coding agents do not run `pnpm test:e2e` locally. CI (`.github/workflows/ci.yml`) runs `pnpm run test:unit`, lint, build, and the full Playwright suite under `tests/e2e/` on `chromium` and `Mobile Chrome` (sharded).

Stack in this repo: React 19, TypeScript, Vite, React Router v7, Zustand, Tailwind CSS, and Supabase Auth. Stores in `src/store/`: `authStore.ts` (session and profile), `gameStore.ts` (session, scenes, mutations), `languageStore.ts` (`en` or `es`). Components subscribe to them directly. Supabase client and schema types are in `src/lib/supabase.ts`. `src/App.tsx` sends signed-out users to `/auth` and signed-in users to `/game`.

Text fields use `src/components/ui/Input.tsx` (label, error, helper text, and the matching `aria-*` attributes). The auth form already uses it. Multiline text uses the existing `Textarea`.

Optional narrative goes from `src/lib/openrouter.ts` through `api/openrouter.ts`. `OPENROUTER_API_KEY` is server-only and must not use the `VITE_` prefix. `VITE_OPENROUTER_ENABLED=false` forces `src/lib/narrative.ts`. Local config belongs in `.env.local` (see `.env.example`). Do not commit credentials, `dist/`, Playwright reports, or test results.

## Definition of done

Before opening or updating a pull request, coding agents run unit tests, lint, and typecheck locally (`pnpm check`). They do not run Playwright end-to-end specs locally. GitHub CI runs the full end-to-end suite (sharded) and must be green on the head before review or merge. Agents push once per round and check the final CI result once; they do not keep re-waking to watch individual CI jobs. Open a pull request against `main` and leave it unmerged. Coding agents never merge and never close issues. Pull requests use only `Refs #N`, never `Closes #N`. Kiki closes only `User Story` issues, after she checks the acceptance criteria. The dev assistant closes `Technical Task` issues at merge. An issue is never closed automatically. Manual steps or QA can keep an issue open.

## Product

User stories come from the product manager. Design comes from the product designer. When an acceptance criterion is ambiguous, state the assumption in the pull request description and implement that. Stay inside the issue.

## Pre-PR checklist

The implementing agent passes this before marking the pull request ready, and copies it into the pull request body as a checked list:

- Issue acceptance criteria reviewed one by one.
- Unit tests, lint, and typecheck pass locally (`pnpm check`). Playwright end-to-end specs are not run locally.
- Any new end-to-end spec runs in CI, and the `e2e` job is green on the head.
- The diff touches only what the story asks. Flag any change to shared components or styles in the pull request body.
- For a UI change: text contrast is at least 4.5:1, and touch targets are at least 44px.
- The pull request body uses only `Refs #N`, never `Closes #N`.

## Screenshots

Any UI change includes this set, saved under `/workspace/qf/<pr-number>/` and attached or linked in the pull request:

- ES: 320x568, 375x667, 740x360 (landscape), and 1280x720.
- EN: 375x667.
- Error, submitting, and focus states, where they exist.

## Team workflow

This section is the source of truth for how the team ships a story.

- The product manager (Kiki) writes user stories as GitHub issues with acceptance criteria and sets their order.
- The product designer (Sophie) may give design guidance before a story with UI is implemented. Her visual OK is not a merge requirement.
- The repo owner (Javi) approves the story order in issue #40 once. No per-story go-ahead is needed.
- The dev assistant (Calcifer) briefs coding agents, who implement with test-driven development and open the pull request unmerged. The dev assistant batches all feedback into a single round back to the implementing agent. Bot-to-bot messages that require the other to act are sent with priority.
- The code reviewer (Jiji) reviews every pull request and every new head for code quality only: architecture, simplicity, no over-engineering, XP practices, refactoring, bugs, security, and tests. Jiji does not review design or acceptance criteria. The code reviewer reports either "no blockers" or a list of blockers, publishes reviews without blockers directly, and asks the repo owner only when there are blockers or the pull request touches auth, data, Supabase, or security. The code reviewer never approves or merges.
- Merge (squash): only the dev assistant merges, once CI is green and Jiji reports no blockers on the final head. Coding agents never merge.
- Pull requests touching auth logic, data, Supabase, or security are the exception: only the repo owner merges them, after his explicit yes.
- Kiki sets the review labels when she creates the issue: `User Story`, `UX`, `Technical Task`, or more than one of them.
- An issue with none of these labels goes back to Kiki to be labeled before work starts.
- Kiki and Sophie do not review the pull request before merge. Sophie may still give design guidance before implementation.
- After a `User Story` merges, the dev assistant notifies Kiki. She checks the acceptance criteria and either closes the issue or comments what is missing.
- After a `UX` issue merges, the dev assistant notifies Sophie to check the design. She reviews screenshots, not code. If the issue is also `User Story`, both are notified.
- A `Technical Task` needs only Jiji's pre-merge review. The dev assistant closes the issue at merge.
- Anything that fails post-merge review is iterated in a new pull request.
- The issue is never closed automatically. Manual steps or QA can keep an issue open.
