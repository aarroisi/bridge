defmodule BridgeWeb.ProjectController do
  use BridgeWeb, :controller

  alias Bridge.Projects
  import BridgeWeb.PaginationHelpers

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, params) do
    workspace_id = conn.assigns.workspace_id

    opts = build_pagination_opts(params)
    page = Projects.list_projects(workspace_id, opts)

    render(conn, :index, page: page)
  end

  def create(conn, %{"project" => project_params}) do
    workspace_id = conn.assigns.workspace_id
    project_params = Map.put(project_params, "workspace_id", workspace_id)

    with {:ok, project} <- Projects.create_project(project_params) do
      conn
      |> put_status(:created)
      |> render(:show, project: project)
    end
  end

  def show(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, project} <- Projects.get_project(id, workspace_id) do
      render(conn, :show, project: project)
    end
  end

  def update(conn, %{"id" => id, "project" => project_params}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, project} <- Projects.get_project(id, workspace_id),
         {:ok, project} <- Projects.update_project(project, project_params) do
      render(conn, :show, project: project)
    end
  end

  def delete(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, project} <- Projects.get_project(id, workspace_id),
         {:ok, _project} <- Projects.delete_project(project) do
      send_resp(conn, :no_content, "")
    end
  end
end
