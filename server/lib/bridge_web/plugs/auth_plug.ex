defmodule BridgeWeb.Plugs.AuthPlug do
  import Plug.Conn
  import Phoenix.Controller

  alias Bridge.Accounts

  def init(opts), do: opts

  def call(conn, _opts) do
    user_id = get_session(conn, :user_id)

    if user_id do
      case Accounts.get_user(user_id) do
        {:ok, user} ->
          # Check if user has a workspace
          if user.workspace_id do
            conn
            |> assign(:current_user, user)
            |> assign(:current_user_id, user.id)
            |> assign(:workspace_id, user.workspace_id)
          else
            conn
            |> put_status(:forbidden)
            |> put_view(json: BridgeWeb.ErrorJSON)
            |> json(%{error: "User not associated with any workspace"})
            |> halt()
          end

        {:error, :not_found} ->
          conn
          |> put_status(:unauthorized)
          |> put_view(json: BridgeWeb.ErrorJSON)
          |> render(:"401")
          |> halt()
      end
    else
      conn
      |> put_status(:unauthorized)
      |> put_view(json: BridgeWeb.ErrorJSON)
      |> render(:"401")
      |> halt()
    end
  end
end
