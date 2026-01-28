defmodule BridgeWeb.AuthController do
  use BridgeWeb, :controller

  alias Bridge.Accounts

  action_fallback(BridgeWeb.FallbackController)

  def register(conn, %{
        "workspace_name" => workspace_name,
        "name" => name,
        "email" => email,
        "password" => password
      }) do
    case Accounts.register_workspace_and_user(workspace_name, name, email, password) do
      {:ok, %{workspace: workspace, user: user}} ->
        conn
        |> put_session(:user_id, user.id)
        |> put_session(:workspace_id, workspace.id)
        |> put_status(:created)
        |> json(%{
          user: %{
            id: user.id,
            name: user.name,
            email: user.email,
            workspace_id: workspace.id
          },
          workspace: %{
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug
          }
        })

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        conn
        |> put_session(:user_id, user.id)
        |> put_session(:workspace_id, user.workspace_id)
        |> json(%{
          user: %{
            id: user.id,
            name: user.name,
            email: user.email,
            workspace_id: user.workspace_id
          },
          workspace: %{
            id: user.workspace.id,
            name: user.workspace.name,
            slug: user.workspace.slug
          }
        })

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})
    end
  end

  def logout(conn, _params) do
    conn
    |> clear_session()
    |> json(%{message: "Logged out successfully"})
  end

  def me(conn, _params) do
    case get_session(conn, :user_id) do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Not authenticated"})

      user_id ->
        user = Accounts.get_user!(user_id) |> Bridge.Repo.preload(:workspace)

        json(conn, %{
          user: %{
            id: user.id,
            name: user.name,
            email: user.email,
            workspace_id: user.workspace_id
          },
          workspace: %{
            id: user.workspace.id,
            name: user.workspace.name,
            slug: user.workspace.slug
          }
        })
    end
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
