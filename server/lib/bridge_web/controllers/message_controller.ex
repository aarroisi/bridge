defmodule BridgeWeb.MessageController do
  use BridgeWeb, :controller

  alias Bridge.Chat

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, params) do
    opts = BridgeWeb.PaginationHelpers.build_pagination_opts(params)

    page =
      case {params["entity_type"], params["entity_id"]} do
        {entity_type, entity_id} when is_binary(entity_type) and is_binary(entity_id) ->
          Chat.list_messages_by_entity(entity_type, entity_id, opts)

        _ ->
          Chat.list_messages(opts)
      end

    render(conn, :index, page: page)
  end

  def create(conn, %{"message" => message_params}) do
    current_user = conn.assigns.current_user
    message_params_with_user = Map.put(message_params, "user_id", current_user.id)

    with {:ok, message} <- Chat.create_message(message_params_with_user) do
      # Preload associations
      message = Bridge.Repo.preload(message, [:user, :parent, quote: [:user]])

      conn
      |> put_status(:created)
      |> render(:show, message: message)
    end
  end

  def show(conn, %{"id" => id}) do
    with {:ok, message} <- Chat.get_message(id) do
      render(conn, :show, message: message)
    end
  end

  def update(conn, %{"id" => id, "message" => message_params}) do
    with {:ok, message} <- Chat.get_message(id),
         {:ok, message} <- Chat.update_message(message, message_params) do
      render(conn, :show, message: message)
    end
  end

  def delete(conn, %{"id" => id}) do
    with {:ok, message} <- Chat.get_message(id),
         {:ok, _message} <- Chat.delete_message(message) do
      send_resp(conn, :no_content, "")
    end
  end
end
