defmodule BridgeWeb.DirectMessageController do
  use BridgeWeb, :controller

  alias Bridge.Chat
  import BridgeWeb.PaginationHelpers
  import Plug.Conn

  action_fallback(BridgeWeb.FallbackController)

  # DMs are accessible to all workspace members - no special authorization needed
  # The user is already authenticated and belongs to the workspace

  plug(:load_resource when action in [:show, :update, :delete])
  plug(:authorize_dm_access when action in [:show, :update, :delete])

  defp load_resource(conn, _opts) do
    case Chat.get_direct_message(conn.params["id"], conn.assigns.workspace_id) do
      {:ok, dm} ->
        assign(conn, :direct_message, dm)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> Phoenix.Controller.json(%{errors: %{detail: "Not Found"}})
        |> halt()
    end
  end

  defp authorize_dm_access(conn, _opts) do
    user = conn.assigns.current_user
    dm = conn.assigns.direct_message

    # User can only access DMs they are part of
    if dm.user1_id == user.id or dm.user2_id == user.id do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "Forbidden"})
      |> halt()
    end
  end

  def index(conn, params) do
    user = conn.assigns.current_user

    opts = build_pagination_opts(params)
    # Only show DMs the current user is part of
    page = Chat.list_direct_messages_by_user(user.id, opts)

    render(conn, :index, page: page)
  end

  def create(conn, %{"direct_message" => direct_message_params}) do
    current_user = conn.assigns.current_user
    workspace_id = conn.assigns.workspace_id

    direct_message_params_with_user =
      direct_message_params
      |> Map.put("user1_id", current_user.id)
      |> Map.put("workspace_id", workspace_id)

    with {:ok, direct_message} <- Chat.create_direct_message(direct_message_params_with_user) do
      conn
      |> put_status(:created)
      |> render(:show, direct_message: direct_message)
    end
  end

  def show(conn, _params) do
    render(conn, :show, direct_message: conn.assigns.direct_message)
  end

  def update(conn, %{"direct_message" => direct_message_params}) do
    with {:ok, direct_message} <-
           Chat.update_direct_message(conn.assigns.direct_message, direct_message_params) do
      render(conn, :show, direct_message: direct_message)
    end
  end

  def delete(conn, _params) do
    with {:ok, _direct_message} <- Chat.delete_direct_message(conn.assigns.direct_message) do
      send_resp(conn, :no_content, "")
    end
  end
end
