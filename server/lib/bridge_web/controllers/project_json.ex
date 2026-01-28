defmodule BridgeWeb.ProjectJSON do
  alias Bridge.Projects.Project

  @doc """
  Renders a list of projects.
  """
  def index(%{page: page}) do
    %{
      data: for(project <- page.entries, do: data(project)),
      metadata: %{
        after: page.metadata.after,
        before: page.metadata.before,
        limit: page.metadata.limit
      }
    }
  end

  def index(%{projects: projects}) do
    %{data: for(project <- projects, do: data(project))}
  end

  @doc """
  Renders a single project.
  """
  def show(%{project: project}) do
    %{data: data(project)}
  end

  @doc """
  Renders errors.
  """
  def error(%{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  defp data(%Project{} = project) do
    %{
      id: project.id,
      name: project.name,
      starred: project.starred,
      inserted_at: project.inserted_at,
      updated_at: project.updated_at
    }
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
