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
- **Test-driven when critical** - At least error handling tests
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