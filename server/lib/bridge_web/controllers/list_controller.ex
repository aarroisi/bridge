defmodule BridgeWeb.ListController do
  use BridgeWeb, :controller

  alias Bridge.Lists
  alias Bridge.Lists.List

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    lists = Lists.list_lists()
    render(conn, :index, lists: lists)
  end

  def create(conn, %{"list" => list_params}) do
    case Lists.create_list(list_params) do
      {:ok, list} ->
        conn
        |> put_status(:created)
        |> render(:show, list: list)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    list = Lists.get_list!(id)
    render(conn, :show, list: list)
  end

  def update(conn, %{"id" => id, "list" => list_params}) do
    list = Lists.get_list!(id)

    case Lists.update_list(list, list_params) do
      {:ok, list} ->
        render(conn, :show, list: list)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    list = Lists.get_list!(id)

    case Lists.delete_list(list) do
      {:ok, _list} ->
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
