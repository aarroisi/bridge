---
name: backend
description: Elixir/Phoenix backend development patterns for Bridge. Use when working on controllers, contexts, schemas, or API endpoints.
user-invocable: false
---

# Bridge Backend Development

## Context

When working on backend code, you're in the `server/` directory working with:

- **Controllers** (`lib/bridge_web/controllers/`) - Handle HTTP requests
- **Contexts** (`lib/bridge/`) - Business logic modules
- **Schemas** (`lib/bridge/*/schema.ex`) - Database models
- **Tests** (`test/`) - Controller and context tests

## Development Principle: Test-Driven Development (TDD)

ALWAYS start with writing tests before implementing features:

1. Write controller/context tests that verify the behavior you're implementing
2. Run tests and see them fail
3. Implement the feature to make tests pass
4. Refactor if needed while keeping tests green

## Key Patterns

### Always use tuple returns in contexts

```elixir
# ✅ Correct pattern
def get_doc(id, workspace_id) do
  case Doc
       |> where([d], d.workspace_id == ^workspace_id)
       |> Repo.get(id) do
    nil -> {:error, :not_found}
    doc -> {:ok, doc}
  end
end
```

### Controllers use `with` and fallback

```elixir
def show(conn, %{"id" => id}) do
  workspace_id = conn.assigns.workspace_id

  with {:ok, doc} <- Docs.get_doc(id, workspace_id) do
    render(conn, :show, doc: doc)
  end
end
```

### Always scope to workspace

```elixir
def list_docs(workspace_id, opts) do
  Doc
  |> where([d], d.workspace_id == ^workspace_id)
  |> order_by([d], desc: d.inserted_at)
  |> Repo.all()
end
```

## File Locations

- **Controllers**: `lib/bridge_web/controllers/`
- **Context modules**: `lib/bridge/`
- **Schemas**: Inside context directories
- **Tests**: `test/bridge_web/controllers/` and `test/bridge/`
- **Migrations**: `priv/repo/migrations/`

## Running Backend

```bash
cd server
mix phx.server      # Start server
mix test            # Run tests
mix format          # Format code
```
