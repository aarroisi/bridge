defmodule BridgeWeb.MessageController do
  use BridgeWeb, :controller

  alias Bridge.Chat
  alias Bridge.Chat.Message

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    messages = Chat.list_messages()
    render(conn, :index, messages: messages)
  end

  def create(conn, %{"message" => message_params}) do
    case Chat.create_message(message_params) do
      {:ok, message} ->
        conn
        |> put_status(:created)
        |> render(:show, message: message)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    message = Chat.get_message!(id)
    render(conn, :show, message: message)
  end

  def update(conn, %{"id" => id, "message" => message_params}) do
    message = Chat.get_message!(id)

    case Chat.update_message(message, message_params) do
      {:ok, message} ->
        render(conn, :show, message: message)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    message = Chat.get_message!(id)

    case Chat.delete_message(message) do
      {:ok, _message} ->
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
