defmodule BridgeWeb.ChannelController do
  use BridgeWeb, :controller

  alias Bridge.Chat
  import BridgeWeb.PaginationHelpers

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, params) do
    workspace_id = conn.assigns.workspace_id

    opts = build_pagination_opts(params)
    page = Chat.list_channels(workspace_id, opts)

    render(conn, :index, page: page)
  end

  def create(conn, %{"channel" => channel_params}) do
    workspace_id = conn.assigns.workspace_id
    channel_params = Map.put(channel_params, "workspace_id", workspace_id)

    with {:ok, channel} <- Chat.create_channel(channel_params) do
      conn
      |> put_status(:created)
      |> render(:show, channel: channel)
    end
  end

  def show(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, channel} <- Chat.get_channel(id, workspace_id) do
      render(conn, :show, channel: channel)
    end
  end

  def update(conn, %{"id" => id, "channel" => channel_params}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, channel} <- Chat.get_channel(id, workspace_id),
         {:ok, channel} <- Chat.update_channel(channel, channel_params) do
      render(conn, :show, channel: channel)
    end
  end

  def delete(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, channel} <- Chat.get_channel(id, workspace_id),
         {:ok, _channel} <- Chat.delete_channel(channel) do
      send_resp(conn, :no_content, "")
    end
  end
end
