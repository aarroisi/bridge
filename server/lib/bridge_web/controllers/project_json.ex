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
    base = %{
      id: project.id,
      name: project.name,
      description: project.description,
      starred: project.starred,
      start_date: project.start_date,
      end_date: project.end_date,
      inserted_at: project.inserted_at,
      updated_at: project.updated_at
    }

    # Include items if preloaded
    if Ecto.assoc_loaded?(project.project_items) do
      Map.put(base, :items, Enum.map(project.project_items, &item_data/1))
    else
      base
    end
  end

  defp item_data(item) do
    %{
      id: item.id,
      item_type: item.item_type,
      item_id: item.item_id
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
