defmodule BridgeWeb.SubtaskController do
  use BridgeWeb, :controller

  alias Bridge.Lists
  alias Bridge.Lists.Subtask

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    subtasks = Lists.list_subtasks()
    render(conn, :index, subtasks: subtasks)
  end

  def create(conn, %{"subtask" => subtask_params}) do
    case Lists.create_subtask(subtask_params) do
      {:ok, subtask} ->
        conn
        |> put_status(:created)
        |> render(:show, subtask: subtask)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    subtask = Lists.get_subtask!(id)
    render(conn, :show, subtask: subtask)
  end

  def update(conn, %{"id" => id, "subtask" => subtask_params}) do
    subtask = Lists.get_subtask!(id)

    case Lists.update_subtask(subtask, subtask_params) do
      {:ok, subtask} ->
        render(conn, :show, subtask: subtask)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    subtask = Lists.get_subtask!(id)

    case Lists.delete_subtask(subtask) do
      {:ok, _subtask} ->
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
