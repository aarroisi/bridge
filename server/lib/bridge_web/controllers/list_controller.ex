defmodule BridgeWeb.ListController do
  use BridgeWeb, :controller

  alias Bridge.Lists
  alias Bridge.Lists.List
  import BridgeWeb.PaginationHelpers

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, params) do
    workspace_id = conn.assigns.workspace_id

    opts = build_pagination_opts(params)
    page = Lists.list_lists(workspace_id, opts)

    render(conn, :index, page: page)
  end

  def create(conn, %{"list" => list_params}) do
    workspace_id = conn.assigns.workspace_id
    list_params = Map.put(list_params, "workspace_id", workspace_id)

    with {:ok, list} <- Lists.create_list(list_params) do
      conn
      |> put_status(:created)
      |> render(:show, list: list)
    end
  end

  def show(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, list} <- Lists.get_list(id, workspace_id) do
      render(conn, :show, list: list)
    end
  end

  def update(conn, %{"id" => id, "list" => list_params}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, list} <- Lists.get_list(id, workspace_id),
         {:ok, list} <- Lists.update_list(list, list_params) do
      render(conn, :show, list: list)
    end
  end

  def delete(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, list} <- Lists.get_list(id, workspace_id),
         {:ok, _list} <- Lists.delete_list(list) do
      send_resp(conn, :no_content, "")
    end
  end
end
