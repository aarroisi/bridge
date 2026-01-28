defmodule BridgeWeb.ProjectController do
  use BridgeWeb, :controller

  alias Bridge.Projects
  alias Bridge.Projects.Project

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    projects = Projects.list_projects()
    render(conn, :index, projects: projects)
  end

  def create(conn, %{"project" => project_params}) do
    case Projects.create_project(project_params) do
      {:ok, project} ->
        conn
        |> put_status(:created)
        |> render(:show, project: project)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    project = Projects.get_project!(id)
    render(conn, :show, project: project)
  end

  def update(conn, %{"id" => id, "project" => project_params}) do
    project = Projects.get_project!(id)

    case Projects.update_project(project, project_params) do
      {:ok, project} ->
        render(conn, :show, project: project)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    project = Projects.get_project!(id)

    case Projects.delete_project(project) do
      {:ok, _project} ->
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
