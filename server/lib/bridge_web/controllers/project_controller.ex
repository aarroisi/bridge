defmodule BridgeWeb.ProjectController do
  use BridgeWeb, :controller

  alias Bridge.Projects
  alias Bridge.Authorization.Policy
  import BridgeWeb.PaginationHelpers
  import Plug.Conn

  action_fallback(BridgeWeb.FallbackController)

  plug(:load_resource when action in [:show, :update, :delete])
  plug(:authorize, :view_project when action in [:show])
  plug(:authorize, :manage_projects when action in [:create, :update, :delete])

  defp load_resource(conn, _opts) do
    case Projects.get_project_with_items(conn.params["id"], conn.assigns.workspace_id) do
      {:ok, project} ->
        assign(conn, :project, project)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> Phoenix.Controller.json(%{errors: %{detail: "Not Found"}})
        |> halt()
    end
  end

  defp authorize(conn, permission) do
    user = conn.assigns.current_user
    resource = conn.assigns[:project]

    if Policy.can?(user, permission, resource) do
      conn
    else
      conn
      |> put_status(:forbidden)
      |> Phoenix.Controller.json(%{error: "Forbidden"})
      |> halt()
    end
  end

  def index(conn, params) do
    workspace_id = conn.assigns.workspace_id
    user = conn.assigns.current_user

    opts = build_pagination_opts(params)
    page = Projects.list_projects_with_items(workspace_id, user, opts)

    render(conn, :index, page: page)
  end

  def create(conn, %{"project" => project_params}) do
    workspace_id = conn.assigns.workspace_id
    member_ids = Map.get(project_params, "member_ids", [])

    project_params =
      project_params
      |> Map.put("workspace_id", workspace_id)
      |> Map.delete("member_ids")

    with {:ok, project} <- Projects.create_project(project_params) do
      # Add members to the project
      Enum.each(member_ids, fn user_id ->
        Projects.add_member(project.id, user_id)
      end)

      conn
      |> put_status(:created)
      |> render(:show, project: project)
    end
  end

  def show(conn, _params) do
    render(conn, :show, project: conn.assigns.project)
  end

  def update(conn, %{"project" => project_params}) do
    with {:ok, project} <- Projects.update_project(conn.assigns.project, project_params) do
      render(conn, :show, project: project)
    end
  end

  def delete(conn, _params) do
    with {:ok, _project} <- Projects.delete_project(conn.assigns.project) do
      send_resp(conn, :no_content, "")
    end
  end
end
