defmodule BridgeWeb.TaskController do
  use BridgeWeb, :controller

  alias Bridge.Lists
  alias Bridge.Lists.Task

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    tasks = Lists.list_tasks()
    render(conn, :index, tasks: tasks)
  end

  def create(conn, %{"task" => task_params}) do
    current_user = conn.assigns.current_user
    task_params_with_user = Map.put(task_params, "created_by_id", current_user.id)

    case Lists.create_task(task_params_with_user) do
      {:ok, task} ->
        conn
        |> put_status(:created)
        |> render(:show, task: task)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    task = Lists.get_task!(id)
    render(conn, :show, task: task)
  end

  def update(conn, %{"id" => id, "task" => task_params}) do
    task = Lists.get_task!(id)

    case Lists.update_task(task, task_params) do
      {:ok, task} ->
        render(conn, :show, task: task)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    task = Lists.get_task!(id)

    case Lists.delete_task(task) do
      {:ok, _task} ->
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
