defmodule BridgeWeb.MessageController do
  use BridgeWeb, :controller

  alias Bridge.Chat
  alias Bridge.Chat.Message

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, params) do
    messages =
      case {params["entity_type"], params["entity_id"]} do
        {entity_type, entity_id} when is_binary(entity_type) and is_binary(entity_id) ->
          Chat.list_messages_by_entity(entity_type, entity_id)

        _ ->
          Chat.list_messages()
      end

    render(conn, :index, messages: messages)
  end

  def create(conn, %{"message" => message_params}) do
    current_user = conn.assigns.current_user
    message_params_with_user = Map.put(message_params, "user_id", current_user.id)

    case Chat.create_message(message_params_with_user) do
      {:ok, message} ->
        # Preload associations
        message = Bridge.Repo.preload(message, [:user, :parent, quote: [:user]])

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
