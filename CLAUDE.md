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