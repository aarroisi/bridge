defmodule BridgeWeb.DirectMessageController do
  use BridgeWeb, :controller

  alias Bridge.Chat
  alias Bridge.Chat.DirectMessage
  import BridgeWeb.PaginationHelpers

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, params) do
    workspace_id = conn.assigns.workspace_id

    opts = build_pagination_opts(params)
    page = Chat.list_direct_messages(workspace_id, opts)

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

  def show(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, direct_message} <- Chat.get_direct_message(id, workspace_id) do
      render(conn, :show, direct_message: direct_message)
    end
  end

  def update(conn, %{"id" => id, "direct_message" => direct_message_params}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, direct_message} <- Chat.get_direct_message(id, workspace_id),
         {:ok, direct_message} <-
           Chat.update_direct_message(direct_message, direct_message_params) do
      render(conn, :show, direct_message: direct_message)
    end
  end

  def delete(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, direct_message} <- Chat.get_direct_message(id, workspace_id),
         {:ok, _direct_message} <- Chat.delete_direct_message(direct_message) do
      send_resp(conn, :no_content, "")
    end
  end
end
