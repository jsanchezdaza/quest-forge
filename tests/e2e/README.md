# E2E Tests

## Overview
This directory contains end-to-end tests for Quest Forge using Playwright.

## Test Files

### Currently Running in CI
- **auth.spec.ts** - Authentication UI tests (6 tests)

### Pending Backend Mock Infrastructure
The following test files have been created but require proper backend mocking infrastructure before they can run in CI:

- **game-page.spec.ts** (8 tests) - Game page navigation and UI
- **character-creation.spec.ts** (17 tests) - Character creation flow
- **gameplay.spec.ts** (12 tests) - Scene progression and player choices
- **level-up.spec.ts** (13 tests) - Character progression and stat allocation
- **navigation.spec.ts** (17 tests) - Auth redirects and session management

**Total**: 67 tests pending proper mock infrastructure

## Why Tests Are Not Running Yet

The new tests require proper mocking of Supabase backend calls. Currently:
- Tests set mock data in localStorage
- However, the app still makes real Supabase API calls
- These calls timeout without a real backend or proper mocks
- This causes CI to exceed time limits

## Next Steps

To enable these tests in CI, we need to:

1. **Implement Backend Mocking**
   - Use MSW (Mock Service Worker) or similar to intercept API calls
   - Create mock handlers for Supabase endpoints
   - Set up test fixtures for database responses

2. **Update Test Setup**
   - Configure MSW in `tests/e2e/setup.ts`
   - Add mock handlers for all Supabase operations
   - Ensure deterministic test behavior

3. **Update CI Configuration**
   - Once mocking is in place, update `.github/workflows/ci.yml`
   - Change from `tests/e2e/auth.spec.ts` to run all tests
   - Tests should complete within the 10-minute timeout

## Running Tests Locally

### All Tests
```bash
pnpm test:e2e
```

### Specific Test File
```bash
pnpm test:e2e tests/e2e/auth.spec.ts
```

### With UI
```bash
pnpm test:e2e --ui
```

## Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| Authentication UI | 6 | ✅ Running in CI |
| Game Page | 8 | ⏸️ Needs mocks |
| Character Creation | 17 | ⏸️ Needs mocks |
| Gameplay | 12 | ⏸️ Needs mocks |
| Level Up | 13 | ⏸️ Needs mocks |
| Navigation | 17 | ⏸️ Needs mocks |
| **Total** | **73** | **6 active, 67 pending** |
