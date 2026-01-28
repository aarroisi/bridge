defmodule BridgeWeb.ChannelController do
  use BridgeWeb, :controller

  alias Bridge.Chat
  alias Bridge.Chat.Channel

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    channels = Chat.list_channels()
    render(conn, :index, channels: channels)
  end

  def create(conn, %{"channel" => channel_params}) do
    case Chat.create_channel(channel_params) do
      {:ok, channel} ->
        conn
        |> put_status(:created)
        |> render(:show, channel: channel)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    channel = Chat.get_channel!(id)
    render(conn, :show, channel: channel)
  end

  def update(conn, %{"id" => id, "channel" => channel_params}) do
    channel = Chat.get_channel!(id)

    case Chat.update_channel(channel, channel_params) do
      {:ok, channel} ->
        render(conn, :show, channel: channel)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    channel = Chat.get_channel!(id)

    case Chat.delete_channel(channel) do
      {:ok, _channel} ->
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
