defmodule BridgeWeb.ProjectItemController do
  use BridgeWeb, :controller

  alias Bridge.Projects
  alias Bridge.Authorization.Policy
  import Plug.Conn

  action_fallback(BridgeWeb.FallbackController)

  plug(:load_project when action in [:index, :create])
  plug(:authorize, :manage_projects when action in [:create, :delete])

  defp load_project(conn, _opts) do
    case Projects.get_project(conn.params["project_id"], conn.assigns.workspace_id) do
      {:ok, project} ->
        assign(conn, :project, project)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> Phoenix.Controller.json(%{errors: %{detail: "Project not found"}})
        |> halt()
    end
  end

  defp authorize(conn, permission) do
    user = conn.assigns.current_user

    if Policy.can?(user, permission, nil) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "Forbidden"})
      |> halt()
    end
  end

  def index(conn, _params) do
    project = conn.assigns.project
    items = Projects.list_items(project.id)
    render(conn, :index, items: items)
  end

  def create(conn, %{"item_type" => item_type, "item_id" => item_id}) do
    project = conn.assigns.project

    with {:ok, item} <- Projects.add_item(project.id, item_type, item_id) do
      conn
      |> put_status(:created)
      |> render(:show, item: item)
    end
  end

  def delete(conn, %{"id" => id}) do
    # id is in format "type:item_id"
    [item_type, item_id] = String.split(id, ":")

    with {:ok, _item} <- Projects.remove_item(item_type, item_id) do
      send_resp(conn, :no_content, "")
    end
  end
end
