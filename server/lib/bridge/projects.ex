defmodule Bridge.Projects do
  @moduledoc """
  The Projects context.
  """

  import Ecto.Query, warn: false
  alias Bridge.Repo

  alias Bridge.Projects.Project

  @doc """
  Returns the list of projects for a workspace.

  ## Examples

      iex> list_projects(workspace_id)
      [%Project{}, ...]

  """
  def list_projects(workspace_id, opts \\ []) do
    Project
    |> where([p], p.workspace_id == ^workspace_id)
    |> order_by([p], desc: p.id)
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Returns the list of projects with their associations preloaded for a workspace.

  ## Examples

      iex> list_projects_with_associations(workspace_id)
      [%Project{lists: [...], docs: [...], channels: [...]}, ...]

  """
  def list_projects_with_associations(workspace_id, opts \\ []) do
    Project
    |> where([p], p.workspace_id == ^workspace_id)
    |> order_by([p], desc: p.id)
    |> preload([:lists, :docs, :channels])
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Returns the list of starred projects for a workspace.

  ## Examples

      iex> list_starred_projects(workspace_id)
      [%Project{}, ...]

  """
  def list_starred_projects(workspace_id, opts \\ []) do
    Project
    |> where([p], p.starred == true and p.workspace_id == ^workspace_id)
    |> order_by([p], desc: p.id)
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Gets a single project within a workspace.

  Returns `{:ok, project}` if found, `{:error, :not_found}` otherwise.

  ## Examples

      iex> get_project(id, workspace_id)
      {:ok, %Project{}}

      iex> get_project(456, workspace_id)
      {:error, :not_found}

  """
  def get_project(id, workspace_id) do
    case Project
         |> where([p], p.workspace_id == ^workspace_id)
         |> Repo.get(id) do
      nil -> {:error, :not_found}
      project -> {:ok, project}
    end
  end

  @doc """
  Gets a single project with associations preloaded within a workspace.

  Returns `{:ok, project}` if found, `{:error, :not_found}` otherwise.

  ## Examples

      iex> get_project_with_associations(id, workspace_id)
      {:ok, %Project{lists: [...], docs: [...], channels: [...]}}

      iex> get_project_with_associations(456, workspace_id)
      {:error, :not_found}

  """
  def get_project_with_associations(id, workspace_id) do
    case Project
         |> where([p], p.workspace_id == ^workspace_id)
         |> preload([:lists, :docs, :channels])
         |> Repo.get(id) do
      nil -> {:error, :not_found}
      project -> {:ok, project}
    end
  end

  @doc """
  Creates a project.

  ## Examples

      iex> create_project(%{field: value})
      {:ok, %Project{}}

      iex> create_project(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_project(attrs \\ %{}) do
    %Project{}
    |> Project.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a project.

  ## Examples

      iex> update_project(project, %{field: new_value})
      {:ok, %Project{}}

      iex> update_project(project, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_project(%Project{} = project, attrs) do
    project
    |> Project.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a project.

  ## Examples

      iex> delete_project(project)
      {:ok, %Project{}}

      iex> delete_project(project)
      {:error, %Ecto.Changeset{}}

  """
  def delete_project(%Project{} = project) do
    Repo.delete(project)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking project changes.

  ## Examples

      iex> change_project(project)
      %Ecto.Changeset{data: %Project{}}

  """
  def change_project(%Project{} = project, attrs \\ %{}) do
    Project.changeset(project, attrs)
  end

  @doc """
  Toggles the starred status of a project.

  ## Examples

      iex> toggle_project_starred(project)
      {:ok, %Project{}}

  """
  def toggle_project_starred(%Project{} = project) do
    update_project(project, %{starred: !project.starred})
  end
end
