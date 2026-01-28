defmodule BridgeWeb.SubtaskController do
  use BridgeWeb, :controller

  alias Bridge.Lists
  alias Bridge.Authorization.Policy
  import Plug.Conn

  action_fallback(BridgeWeb.FallbackController)

  plug(:load_resource when action in [:show, :update, :delete])
  plug(:authorize, :view_item when action in [:show])
  plug(:authorize, :create_item when action in [:create])
  plug(:authorize, :update_item when action in [:update])
  plug(:authorize, :delete_item when action in [:delete])

  defp load_resource(conn, _opts) do
    case Lists.get_subtask(conn.params["id"]) do
      {:ok, subtask} ->
        assign(conn, :subtask, subtask)

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
    # For create, we need to get the task's list's project_id
    params = conn.params["subtask"] || conn.params
    task_id = params["task_id"]

    if task_id do
      case Lists.get_task(task_id) do
        {:ok, task} -> task.list.project_id
        _ -> nil
      end
    else
      nil
    end
  end

  defp get_authorization_resource(conn, _permission) do
    conn.assigns[:subtask]
  end

  def index(conn, _params) do
    subtasks = Lists.list_subtasks()
    render(conn, :index, subtasks: subtasks)
  end

  def create(conn, %{"subtask" => subtask_params}) do
    current_user = conn.assigns.current_user
    subtask_params_with_user = Map.put(subtask_params, "created_by_id", current_user.id)

    with {:ok, subtask} <- Lists.create_subtask(subtask_params_with_user) do
      conn
      |> put_status(:created)
      |> render(:show, subtask: subtask)
    end
  end

  def show(conn, _params) do
    render(conn, :show, subtask: conn.assigns.subtask)
  end

  def update(conn, %{"subtask" => subtask_params}) do
    with {:ok, subtask} <- Lists.update_subtask(conn.assigns.subtask, subtask_params) do
      render(conn, :show, subtask: subtask)
    end
  end

  def delete(conn, _params) do
    with {:ok, _subtask} <- Lists.delete_subtask(conn.assigns.subtask) do
      send_resp(conn, :no_content, "")
    end
  end
end
