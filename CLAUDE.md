# Bridge Project

Bridge is a team collaboration platform: Elixir/Phoenix backend + React/TypeScript frontend.

## Quick Reference

```bash
# Backend (port 4000)           # Frontend (port 5173)
cd server && mix phx.server     cd web && npm run dev

# Tests
cd server && mix test           cd web && npx playwright test
```

## Critical Rules

1. **Workspace Isolation**: Always filter by `workspace_id` - prevents data leakage
2. **Tuple Returns**: Use `{:ok, result}` / `{:error, reason}` - never bang functions
3. **Test-Driven**: Always use TDD for both backend and frontend - write tests first, then implement
4. **E2E Testing**: Use `keyboard.insertText()` for React inputs, NOT `fill()`
5. **Toast Notifications**: Always show toast after successful backend mutations (create, update, delete) using `useToastStore`

## Documentation

Detailed guides organized as skills in `.claude/skills/`:

- `/development` - Project structure, commands, monorepo navigation
- `/architecture` - Patterns: error handling, controllers, multi-tenancy, UUIDs, pagination
- `/testing` - TDD practices, factories, meaningful tests
- `/e2e-testing` - Playwright + React gotchas (controlled inputs)

Background skills (auto-loaded by context):

- `backend` - Elixir/Phoenix patterns when in `server/`
- `frontend` - React/TypeScript patterns when in `web/`

## Tech Stack

**Backend**: Elixir 1.16+, Phoenix 1.8, PostgreSQL, Phoenix Channels  
**Frontend**: React 18, TypeScript, Vite, Zustand, Tailwind, Playwright

Claude automatically loads relevant skills based on your work context.
