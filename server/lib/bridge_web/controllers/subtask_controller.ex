defmodule BridgeWeb.SubtaskController do
  use BridgeWeb, :controller

  alias Bridge.Lists

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    subtasks = Lists.list_subtasks()
    render(conn, :index, subtasks: subtasks)
  end

  def create(conn, %{"subtask" => subtask_params}) do
    with {:ok, subtask} <- Lists.create_subtask(subtask_params) do
      conn
      |> put_status(:created)
      |> render(:show, subtask: subtask)
    end
  end

  def show(conn, %{"id" => id}) do
    with {:ok, subtask} <- Lists.get_subtask(id) do
      render(conn, :show, subtask: subtask)
    end
  end

  def update(conn, %{"id" => id, "subtask" => subtask_params}) do
    with {:ok, subtask} <- Lists.get_subtask(id),
         {:ok, subtask} <- Lists.update_subtask(subtask, subtask_params) do
      render(conn, :show, subtask: subtask)
    end
  end

  def delete(conn, %{"id" => id}) do
    with {:ok, subtask} <- Lists.get_subtask(id),
         {:ok, _subtask} <- Lists.delete_subtask(subtask) do
      send_resp(conn, :no_content, "")
    end
  end
end
