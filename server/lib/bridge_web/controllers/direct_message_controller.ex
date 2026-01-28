defmodule BridgeWeb.DirectMessageController do
  use BridgeWeb, :controller

  alias Bridge.Chat
  alias Bridge.Chat.DirectMessage

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    direct_messages = Chat.list_direct_messages()
    render(conn, :index, direct_messages: direct_messages)
  end

  def create(conn, %{"direct_message" => direct_message_params}) do
    case Chat.create_direct_message(direct_message_params) do
      {:ok, direct_message} ->
        conn
        |> put_status(:created)
        |> render(:show, direct_message: direct_message)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    direct_message = Chat.get_direct_message!(id)
    render(conn, :show, direct_message: direct_message)
  end

  def update(conn, %{"id" => id, "direct_message" => direct_message_params}) do
    direct_message = Chat.get_direct_message!(id)

    case Chat.update_direct_message(direct_message, direct_message_params) do
      {:ok, direct_message} ->
        render(conn, :show, direct_message: direct_message)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    direct_message = Chat.get_direct_message!(id)

    case Chat.delete_direct_message(direct_message) do
      {:ok, _direct_message} ->
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
