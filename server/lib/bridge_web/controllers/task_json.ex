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
      completed_at: task.completed_at,
      board_id: task.list_id,
      status_id: task.status_id,
      assignee_id: task.assignee_id,
      assignee: get_assignee(task),
      created_by_id: task.created_by_id,
      created_by: get_created_by(task),
      subtask_count: get_subtask_count(task),
      subtask_done_count: get_subtask_done_count(task),
      comment_count: task.comment_count || 0,
      inserted_at: task.inserted_at,
      updated_at: task.updated_at
    }

    # Include status object if loaded
    if Ecto.assoc_loaded?(task.status) and task.status do
      Map.put(base, :status, %{
        id: task.status.id,
        name: task.status.name,
        color: task.status.color,
        position: task.status.position,
        is_done: task.status.is_done
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

  defp get_subtask_count(%Task{subtasks: subtasks}) when is_list(subtasks),
    do: length(subtasks)

  defp get_subtask_count(_), do: 0

  defp get_subtask_done_count(%Task{subtasks: subtasks}) when is_list(subtasks),
    do: Enum.count(subtasks, & &1.is_completed)

  defp get_subtask_done_count(_), do: 0

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
