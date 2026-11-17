# E2E Tests

Playwright specs live in this directory. `playwright.config.ts` sets `testDir` to `./tests/e2e`.

CI (`.github/workflows/ci.yml`) runs every `*.spec.ts` here on `chromium` and `Mobile Chrome`. The job does not pass a file list, so a new spec is included automatically. `setup.ts` and `pixelContrast.ts` are helpers, not specs.

The suite mocks Supabase through `window.mockSupabaseAuth` in `setup.ts` and the test-mode seam in `src/lib/testMode.ts`. It does not need real credentials.

## Running tests locally

### All tests

```bash
pnpm test:e2e
```

### One file

```bash
pnpm test:e2e tests/e2e/auth.spec.ts
```

### One project

```bash
pnpm exec playwright test --project=chromium
```

### With UI

```bash
pnpm test:e2e --ui
```
