# Bridge Development Guide

## Project Structure

This is a **monorepo** containing multiple projects:

```
bridge/
├── server/          # Elixir/Phoenix backend API
│   ├── lib/
│   │   ├── bridge/           # Context modules (business logic)
│   │   └── bridge_web/       # Controllers, channels, views
│   ├── test/                 # Backend tests
│   ├── mix.exs              # Elixir dependencies
│   └── config/              # Backend configuration
│
├── web/             # React/TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── stores/          # Zustand state management
│   │   └── lib/             # Utilities
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite configuration
│
└── .claude/         # AI assistant configuration
```

### Working with Multiple Projects

**IMPORTANT**: When making changes, be aware of which project you're in:

```bash
# Backend (Elixir/Phoenix)
cd server/
mix phx.server          # Start backend server (port 4000)
mix test                # Run backend tests
mix format              # Format Elixir code

# Frontend (React/TypeScript)
cd web/
npm run dev             # Start frontend dev server (port 5173)
npm test                # Run frontend tests
npm run build           # Build for production
npm run lint            # Lint TypeScript/React code
```

### Default Behavior

- When asked to "run the server" → Start backend: `cd server && mix phx.server`
- When asked to "run tests" → Run backend tests: `cd server && mix test`
- When working on controllers, contexts, schemas → Work in `server/`
- When working on components, pages, UI → Work in `web/`
- When in doubt about which project, **ASK THE USER** for clarification

## Project Overview

Bridge is a team collaboration platform built with:

- **Backend**: Elixir/Phoenix (server/)
- **Frontend**: React/TypeScript with Vite (web/)
- **Database**: PostgreSQL
- **Real-time**: Phoenix Channels for WebSocket communication

### Technology Stack

**Backend (server/)**:

- Elixir 1.16+
- Phoenix 1.8
- Ecto (PostgreSQL ORM)
- Phoenix Channels (WebSockets)
- UUIDv7 (time-sortable UUIDs)
- ExMachina + Faker (testing)

**Frontend (web/)**:

- React 18
- TypeScript
- Vite (build tool)
- Zustand (state management)
- TanStack Query (data fetching)
- Tailwind CSS (styling)

## Architecture Principles

### Error Handling Pattern

**ALWAYS use tuple returns, NEVER use bang functions:**

```elixir
# ✅ GOOD - Tuple returns
def get_doc(id, workspace_id) do
  case Doc
       |> where([d], d.workspace_id == ^workspace_id)
       |> Repo.get(id) do
    nil -> {:error, :not_found}
    doc -> {:ok, doc}
  end
end

# ❌ BAD - Bang function that raises exceptions
def get_doc!(id, workspace_id) do
  Doc
  |> where([d], d.workspace_id == ^workspace_id)
  |> Repo.get!(id)
end
```

### Controller Pattern

Controllers use `with` statements and rely on `FallbackController` for error handling:

```elixir
defmodule BridgeWeb.DocController do
  use BridgeWeb, :controller

  action_fallback(BridgeWeb.FallbackController)

  # ✅ GOOD - Clean with statement
  def show(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, doc} <- Docs.get_doc(id, workspace_id) do
      render(conn, :show, doc: doc)
    end
  end

  # ❌ BAD - Manual error handling
  def show(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    case Docs.get_doc(id, workspace_id) do
      {:ok, doc} ->
        render(conn, :show, doc: doc)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{errors: %{detail: "Doc not found"}})
    end
  end
end
```

The `FallbackController` automatically handles:

- `{:error, :not_found}` → 404 response
- `{:error, %Ecto.Changeset{}}` → 422 response with validation errors

### Multi-tenancy with Workspace Isolation

All resources are scoped to workspaces:

```elixir
# Always include workspace_id in queries
def list_docs(workspace_id, opts) do
  Doc
  |> where([d], d.workspace_id == ^workspace_id)
  |> # ... pagination, ordering, etc
end
```

### UUIDs and Primary Keys

Use UUIDv7 (time-sortable) for all primary keys:

```elixir
schema "docs" do
  field(:title, :string)
  field(:content, :string, default: "")

  belongs_to(:workspace, Bridge.Accounts.Workspace)
  belongs_to(:author, Bridge.Accounts.User)

  timestamps()
end

# In the migration
create table(:docs, primary_key: false) do
  add :id, :binary_id, primary_key: true, default: fragment("gen_random_uuid()")
  # ...
end
```

## Testing

### Development Principle: Test-Driven Development (TDD)

ALWAYS start with writing tests before implementing features:

1. Write meaningful integration tests that call actual API endpoints
2. Run tests and see them fail
3. Implement the feature to make tests pass
4. Refactor if needed while keeping tests green

### Test Setup

Tests use `BridgeWeb.ConnCase` for controller tests:

```elixir
defmodule BridgeWeb.DocControllerTest do
  use BridgeWeb.ConnCase

  setup do
    # Create test data using factories
    workspace = insert(:workspace)
    user = insert(:user, workspace_id: workspace.id)

    # Authenticate conn (if your app has auth)
    conn = conn
           |> put_session(:user_id, user.id)
           |> put_req_header("accept", "application/json")

    {:ok, conn: conn, workspace: workspace, user: user}
  end
end
```

### Factory Pattern

Use ExMachina factories (in `test/support/factory.ex`):

```elixir
# Define factories
def workspace_factory do
  %Bridge.Accounts.Workspace{
    name: "Test Workspace",
    slug: sequence(:slug, &"workspace-#{&1}")
  }
end

def user_factory do
  %Bridge.Accounts.User{
    name: "Test User",
    email: sequence(:email, &"user-#{&1}@example.com"),
    password_hash: Bcrypt.hash_pwd_salt("password123"),
    workspace: build(:workspace)
  }
end

def doc_factory do
  %Bridge.Docs.Doc{
    title: "Test Doc",
    content: "Test content",
    workspace: build(:workspace),
    author: build(:user)
  }
end

# Use in tests
workspace = insert(:workspace)
user = insert(:user, workspace_id: workspace.id)
doc = insert(:doc, workspace_id: workspace.id, author_id: user.id)
```

### Writing Meaningful Tests

**DO NOT** just insert data manually and read it back - that tests nothing!

**DO** create data through actual API endpoints and verify business logic:

```elixir
# ❌ BAD - meaningless test
test "lists docs", %{conn: conn, workspace: workspace} do
  doc = insert(:doc, workspace_id: workspace.id, title: "Test")

  response = conn
             |> get(~p"/api/docs")
             |> json_response(200)

  assert hd(response["data"])["title"] == "Test"
end

# ✅ GOOD - tests actual business logic
test "creates doc and includes it in list", %{conn: conn} do
  # Create through API
  create_response = conn
                    |> post(~p"/api/docs", %{doc: %{title: "Test Doc"}})
                    |> json_response(201)

  doc_id = create_response["data"]["id"]

  # Verify it appears in list
  list_response = conn
                  |> get(~p"/api/docs")
                  |> json_response(200)

  assert Enum.any?(list_response["data"], fn doc ->
    doc["id"] == doc_id && doc["title"] == "Test Doc"
  end)
end

# ✅ GOOD - tests workspace isolation
test "cannot access docs from other workspaces", %{conn: conn} do
  other_workspace = insert(:workspace)
  other_doc = insert(:doc, workspace_id: other_workspace.id)

  response = conn
             |> get(~p"/api/docs/#{other_doc.id}")
             |> json_response(404)

  assert response["errors"]["detail"] == "Doc not found"
end

# ✅ GOOD - tests validation
test "cannot create doc without title", %{conn: conn} do
  response = conn
             |> post(~p"/api/docs", %{doc: %{content: "Content only"}})
             |> json_response(422)

  assert response["errors"]["title"] == ["can't be blank"]
end
```

### Test Structure

Organize tests by controller action:

```elixir
defmodule BridgeWeb.DocControllerTest do
  use BridgeWeb.ConnCase

  describe "index" do
    test "returns all docs in workspace", %{conn: conn} do
      # Test implementation
    end

    test "does not return docs from other workspaces", %{conn: conn} do
      # Test implementation
    end

    test "supports pagination", %{conn: conn} do
      # Test implementation
    end
  end

  describe "create" do
    test "creates doc with valid attributes", %{conn: conn} do
      # Test implementation
    end

    test "returns error with invalid attributes", %{conn: conn} do
      # Test implementation
    end
  end

  describe "show" do
    test "returns doc when found", %{conn: conn} do
      # Test implementation
    end

    test "returns 404 when doc not found", %{conn: conn} do
      # Test implementation
    end
  end

  describe "update" do
    test "updates doc with valid attributes", %{conn: conn} do
      # Test implementation
    end

    test "returns 404 when doc not found", %{conn: conn} do
      # Test implementation
    end
  end

  describe "delete" do
    test "deletes doc when found", %{conn: conn} do
      # Test implementation
    end

    test "returns 404 when doc not found", %{conn: conn} do
      # Test implementation
    end
  end
end
```

### Running Tests

```bash
# Run all tests
cd server && mix test

# Run specific test file
mix test test/bridge_web/controllers/doc_controller_test.exs

# Run specific test
mix test test/bridge_web/controllers/doc_controller_test.exs:45

# Run tests with coverage
mix coveralls
```

### Test Coverage Goals

- **Controllers**: 100% coverage for all actions
- **Context modules**: 100% coverage for public functions
- **Channels**: Test join, handle_in callbacks, and broadcasts

## Common Patterns

### Creating Resources

```elixir
def create(conn, %{"resource" => resource_params}) do
  workspace_id = conn.assigns.workspace_id
  user = conn.assigns.current_user

  resource_params =
    resource_params
    |> Map.put("workspace_id", workspace_id)
    |> Map.put("author_id", user.id)

  with {:ok, resource} <- Context.create_resource(resource_params) do
    conn
    |> put_status(:created)
    |> render(:show, resource: resource)
  end
end
```

### Updating Resources

```elixir
def update(conn, %{"id" => id, "resource" => resource_params}) do
  workspace_id = conn.assigns.workspace_id

  with {:ok, resource} <- Context.get_resource(id, workspace_id),
       {:ok, resource} <- Context.update_resource(resource, resource_params) do
    render(conn, :show, resource: resource)
  end
end
```

### Deleting Resources

```elixir
def delete(conn, %{"id" => id}) do
  workspace_id = conn.assigns.workspace_id

  with {:ok, resource} <- Context.get_resource(id, workspace_id),
       {:ok, _resource} <- Context.delete_resource(resource) do
    send_resp(conn, :no_content, "")
  end
end
```

## Useful Commands

```bash
# Start server
cd server && mix phx.server

# Start frontend
cd web && npm run dev

# Database
mix ecto.create        # Create database
mix ecto.migrate       # Run migrations
mix ecto.rollback      # Rollback last migration
mix ecto.reset         # Drop, create, and migrate

# Tests
mix test               # Run all tests
mix test --trace       # Run with detailed output
mix coveralls          # Run with coverage report

# Code Quality
mix format             # Format code
mix credo              # Static analysis
mix dialyzer           # Type checking
```
