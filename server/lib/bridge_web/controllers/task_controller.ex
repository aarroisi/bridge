defmodule BridgeWeb.TaskController do
  use BridgeWeb, :controller

  alias Bridge.Lists
  alias Bridge.Projects
  alias Bridge.Authorization.Policy
  import Plug.Conn

  action_fallback(BridgeWeb.FallbackController)

  plug(:load_resource when action in [:show, :update, :delete])
  plug(:authorize, :view_item when action in [:show])
  plug(:authorize, :create_item when action in [:create])
  plug(:authorize, :update_item when action in [:update])
  plug(:authorize, :delete_item when action in [:delete])

  defp load_resource(conn, _opts) do
    case Lists.get_task(conn.params["id"]) do
      {:ok, task} ->
        assign(conn, :task, task)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> Phoenix.Controller.json(%{errors: %{detail: "Not Found"}})
        |> halt()
    end
  end

  defp authorize(conn, permission) do
    user = conn.assigns.current_user
    resource = get_authorization_resource(conn, permission)

    if Policy.can?(user, permission, resource) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "Forbidden"})
      |> halt()
    end
  end

  defp get_authorization_resource(conn, :create_item) do
    # For create, we need to get the list's project_id via project_items
    params = conn.params["task"] || conn.params
    list_id = params["list_id"]

    if list_id do
      Projects.get_item_project_id("list", list_id)
    else
      nil
    end
  end

  defp get_authorization_resource(conn, _permission) do
    conn.assigns[:task]
  end

  def index(conn, params) do
    case params["list_id"] do
      list_id when is_binary(list_id) ->
        opts = BridgeWeb.PaginationHelpers.build_pagination_opts(params)
        page = Lists.list_tasks(list_id, opts)
        render(conn, :index, page: page)

      _ ->
        # If no list_id provided, return empty result
        render(conn, :index, tasks: [])
    end
  end

  def create(conn, %{"task" => task_params}) do
    current_user = conn.assigns.current_user
    task_params_with_user = Map.put(task_params, "created_by_id", current_user.id)

    with {:ok, task} <- Lists.create_task(task_params_with_user) do
      conn
      |> put_status(:created)
      |> render(:show, task: task)
    end
  end

  def show(conn, _params) do
    render(conn, :show, task: conn.assigns.task)
  end

  def update(conn, %{"task" => task_params}) do
    with {:ok, task} <- Lists.update_task(conn.assigns.task, task_params) do
      render(conn, :show, task: task)
    end
  end

  def delete(conn, _params) do
    with {:ok, _task} <- Lists.delete_task(conn.assigns.task) do
      send_resp(conn, :no_content, "")
    end
  end
end
