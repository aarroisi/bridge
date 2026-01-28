---
name: architecture
description: Bridge project architecture patterns, error handling, multi-tenancy, and UUIDs. Use when implementing new features, refactoring code, or explaining architectural decisions.
---

# Bridge Architecture Patterns

## Error Handling Pattern

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

## Controller Pattern

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
end
```

The `FallbackController` automatically handles:

- `{:error, :not_found}` → 404 response
- `{:error, %Ecto.Changeset{}}` → 422 response with validation errors

## Multi-tenancy with Workspace Isolation

All resources are scoped to workspaces:

```elixir
# Always include workspace_id in queries
def list_docs(workspace_id, opts) do
  Doc
  |> where([d], d.workspace_id == ^workspace_id)
  |> # ... pagination, ordering, etc
end
```

## UUIDs and Primary Keys

Package: `{:uuidv7, "~> 1.0"}`

Use UUIDv7 (time-sortable) for all primary keys:

```elixir
schema "docs" do
  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID

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

**Benefits**: Time-ordered IDs, better database index performance, distributed-safe.

## Pagination

Package: `{:paginator, "~> 1.2"}`

All list endpoints use cursor-based pagination for better performance and consistency.

**Configuration**:

- Default limit: 50 items per page
- Always use `desc: id` for default sorting
- Maintain composite indices on `(workspace_id, id)` for optimal performance

**Query parameters**:

- `after`: Cursor for next page
- `before`: Cursor for previous page
- `limit`: Items per page

**Example**:

```elixir
def list_docs(workspace_id, opts) do
  Doc
  |> where([d], d.workspace_id == ^workspace_id)
  |> order_by([d], desc: d.id)
  |> Paginator.paginate(opts)
end
```

## Database Indices

For paginated resources, create composite indices for optimal performance:

```elixir
# Migration
create index(:docs, [:workspace_id])
create index(:docs, [:workspace_id, :id])
```

Both single-column and composite indices are maintained for different query patterns.

## Authentication & Authorization

All API endpoints require authentication via session cookies and workspace context.

**Critical**: All queries MUST filter by `workspace_id` to prevent cross-workspace data leakage.

## Role-Based Access Control (RBAC)

Bridge implements a role-based permission system with three roles:

### Roles

| Role       | Description                                                        |
| ---------- | ------------------------------------------------------------------ |
| **owner**  | Full access to everything in workspace, can manage members         |
| **member** | Access only to assigned projects, can only update/delete own items |
| **guest**  | Same as member but limited to ONE project                          |

### Permission Rules

| Action                            | Owner | Member | Guest      |
| --------------------------------- | ----- | ------ | ---------- |
| See workspace-level items         | Yes   | No     | No         |
| See items in assigned projects    | Yes   | Yes    | Yes        |
| Create items in assigned projects | Yes   | Yes    | Yes        |
| Update ANY item                   | Yes   | No     | No         |
| Update OWN items                  | Yes   | Yes    | Yes        |
| Delete ANY item                   | Yes   | No     | No         |
| Delete OWN items                  | Yes   | Yes    | Yes        |
| Comment on viewable items         | Yes   | Yes    | Yes        |
| Manage workspace members          | Yes   | No     | No         |
| Manage project members            | Yes   | No     | No         |
| Multiple project assignments      | Yes   | Yes    | No (max 1) |

### Authorization Implementation

Authorization is implemented via plugs in controllers:

```elixir
defmodule BridgeWeb.DocController do
  plug :load_resource when action in [:show, :update, :delete]
  plug :authorize, :view_item when action in [:show]
  plug :authorize, :create_item when action in [:create]
  plug :authorize, :update_item when action in [:update]
  plug :authorize, :delete_item when action in [:delete]

  defp load_resource(conn, _opts) do
    case Docs.get_doc(conn.params["id"], conn.assigns.workspace_id) do
      {:ok, doc} -> assign(conn, :doc, doc)
      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> Phoenix.Controller.json(%{errors: %{detail: "Not Found"}})
        |> halt()
    end
  end

  defp authorize(conn, permission) do
    user = conn.assigns.current_user
    resource = conn.assigns[:doc]

    if Policy.can?(user, permission, resource) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "Forbidden"})
      |> halt()
    end
  end
end
```

### Policy Module

The `Bridge.Authorization.Policy` module defines all permission rules:

```elixir
# Owner can do anything
def can?(%User{role: "owner"}, _action, _resource), do: true

# Members/guests check project membership and ownership
def can?(user, :view_item, item), do: is_project_member?(user, item.project_id)
def can?(user, :update_item, item), do: is_creator?(user, item) and is_project_member?(user, item.project_id)
```

### Filtering by User Access

Context functions filter results based on user role:

```elixir
def list_docs(workspace_id, user, opts \\ []) do
  Doc
  |> where([d], d.workspace_id == ^workspace_id)
  |> filter_by_user_access(user)
  |> Repo.paginate(opts)
end

defp filter_by_user_access(query, user) do
  case Authorization.accessible_project_ids(user) do
    :all -> query  # Owner sees all
    project_ids -> where(query, [d], d.project_id in ^project_ids)
  end
end
```

### Key Tables

- `users.role` - Role field ("owner", "member", "guest")
- `project_members` - Join table linking users to projects
- Items have `created_by_id` or `author_id` for ownership tracking

## Common Controller Patterns

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
