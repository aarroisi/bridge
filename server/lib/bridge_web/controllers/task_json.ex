defmodule BridgeWeb.TaskJSON do
  alias Bridge.Lists.Task

  @doc """
  Renders a list of tasks.
  """
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
    %{
      id: task.id,
      title: task.title,
      status: task.status,
      notes: task.notes,
      due_on: task.due_on,
      list_id: task.list_id,
      assignee_id: task.assignee_id,
      created_by_id: task.created_by_id,
      inserted_at: task.inserted_at,
      updated_at: task.updated_at
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
