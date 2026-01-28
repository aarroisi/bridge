defmodule BridgeWeb.TaskController do
  use BridgeWeb, :controller

  alias Bridge.Lists
  alias Bridge.Lists.Task

  action_fallback(BridgeWeb.FallbackController)

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

  def show(conn, %{"id" => id}) do
    with {:ok, task} <- Lists.get_task(id) do
      render(conn, :show, task: task)
    end
  end

  def update(conn, %{"id" => id, "task" => task_params}) do
    with {:ok, task} <- Lists.get_task(id),
         {:ok, task} <- Lists.update_task(task, task_params) do
      render(conn, :show, task: task)
    end
  end

  def delete(conn, %{"id" => id}) do
    with {:ok, task} <- Lists.get_task(id),
         {:ok, _task} <- Lists.delete_task(task) do
      send_resp(conn, :no_content, "")
    end
  end
end
