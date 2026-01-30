defmodule BridgeWeb.TaskJSON do
  alias Bridge.Lists.Task

  @doc """
  Renders a list of tasks.
  """
  def index(%{page: page}) do
    %{
      data: for(task <- page.entries, do: data(task)),
      metadata: %{
        after: page.metadata.after,
        before: page.metadata.before,
        limit: page.metadata.limit
      }
    }
  end

  def index(%{tasks: tasks}) do
    %{data: for(task <- tasks, do: data(task))}
  end

  @doc """
  Renders a single task.
  """
  def show(%{task: task}) do
    %{data: data(task)}
  end

  @doc """
  Renders errors.
  """
  def error(%{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  defp data(%Task{} = task) do
    base = %{
      id: task.id,
      title: task.title,
      position: task.position,
      notes: task.notes,
      due_on: task.due_on,
      list_id: task.list_id,
      status_id: task.status_id,
      assignee_id: task.assignee_id,
      assignee: get_assignee(task),
      created_by_id: task.created_by_id,
      created_by: get_created_by(task),
      inserted_at: task.inserted_at,
      updated_at: task.updated_at
    }

    # Include status object if loaded
    if Ecto.assoc_loaded?(task.status) and task.status do
      Map.put(base, :status, %{
        id: task.status.id,
        name: task.status.name,
        color: task.status.color,
        position: task.status.position
      })
    else
      base
    end
  end

  defp get_assignee(%Task{assignee: %{id: id, name: name, email: email}}),
    do: %{id: id, name: name, email: email}

  defp get_assignee(_), do: nil

  defp get_created_by(%Task{created_by: %{id: id, name: name, email: email}}),
    do: %{id: id, name: name, email: email}

  defp get_created_by(_), do: nil

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
