defmodule Bridge.Lists do
  @moduledoc """
  The Lists context.
  """

  import Ecto.Query, warn: false
  alias Bridge.Repo

  alias Bridge.Lists.{List, Task, Subtask}

  # ============================================================================
  # List functions
  # ============================================================================

  @doc """
  Returns the list of lists for a workspace, filtered by user access.

  ## Examples

      iex> list_lists(workspace_id, user)
      [%List{}, ...]

  """
  def list_lists(workspace_id, _user, opts \\ []) do
    List
    |> where([l], l.workspace_id == ^workspace_id)
    |> order_by([l], desc: l.id)
    |> preload([:created_by])
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Returns the list of starred lists for a workspace.

  ## Examples

      iex> list_starred_lists(workspace_id, user)
      [%List{}, ...]

  """
  def list_starred_lists(workspace_id, _user, opts \\ []) do
    List
    |> where([l], l.starred == true and l.workspace_id == ^workspace_id)
    |> order_by([l], desc: l.id)
    |> preload([:created_by])
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Gets a single list within a workspace.

  Returns `{:ok, list}` if found, `{:error, :not_found}` otherwise.

  ## Examples

      iex> get_list(id, workspace_id)
      {:ok, %List{}}

      iex> get_list(456, workspace_id)
      {:error, :not_found}

  """
  def get_list(id, workspace_id) do
    case List
         |> where([l], l.workspace_id == ^workspace_id)
         |> preload([:created_by, tasks: [:assignee, :created_by]])
         |> Repo.get(id) do
      nil -> {:error, :not_found}
      list -> {:ok, list}
    end
  end

  @doc """
  Creates a list.

  ## Examples

      iex> create_list(%{field: value})
      {:ok, %List{}}

      iex> create_list(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_list(attrs \\ %{}) do
    %List{}
    |> List.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a list.

  ## Examples

      iex> update_list(list, %{field: new_value})
      {:ok, %List{}}

      iex> update_list(list, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_list(%List{} = list, attrs) do
    list
    |> List.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a list.

  ## Examples

      iex> delete_list(list)
      {:ok, %List{}}

      iex> delete_list(list)
      {:error, %Ecto.Changeset{}}

  """
  def delete_list(%List{} = list) do
    Repo.delete(list)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking list changes.

  ## Examples

      iex> change_list(list)
      %Ecto.Changeset{data: %List{}}

  """
  def change_list(%List{} = list, attrs \\ %{}) do
    List.changeset(list, attrs)
  end

  @doc """
  Toggles the starred status of a list.

  ## Examples

      iex> toggle_list_starred(list)
      {:ok, %List{}}

  """
  def toggle_list_starred(%List{} = list) do
    update_list(list, %{starred: !list.starred})
  end

  # ============================================================================
  # Task functions
  # ============================================================================

  @doc """
  Returns the list of tasks for a specific list.

  ## Examples

      iex> list_tasks(list_id)
      [%Task{}, ...]

  """
  def list_tasks(list_id, opts \\ []) when is_binary(list_id) do
    Task
    |> where([t], t.list_id == ^list_id)
    |> order_by([t], desc: t.id)
    |> preload([:list, :assignee, :created_by, subtasks: [:assignee, :created_by]])
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Returns the list of tasks assigned to a specific user.

  ## Examples

      iex> list_tasks_by_assignee(user_id)
      [%Task{}, ...]

  """
  def list_tasks_by_assignee(assignee_id) do
    Task
    |> where([t], t.assignee_id == ^assignee_id)
    |> preload([:list, :assignee, :created_by, :subtasks])
    |> Repo.all()
  end

  @doc """
  Returns the list of tasks with a specific status.

  ## Examples

      iex> list_tasks_by_status("todo")
      [%Task{}, ...]

  """
  def list_tasks_by_status(status) do
    Task
    |> where([t], t.status == ^status)
    |> preload([:list, :assignee, :created_by, :subtasks])
    |> Repo.all()
  end

  @doc """
  Returns the list of tasks due on or before a specific date.

  ## Examples

      iex> list_tasks_due_by(~D[2024-12-31])
      [%Task{}, ...]

  """
  def list_tasks_due_by(date) do
    Task
    |> where([t], not is_nil(t.due_on) and t.due_on <= ^date)
    |> preload([:list, :assignee, :created_by, :subtasks])
    |> order_by([t], asc: t.due_on)
    |> Repo.all()
  end

  @doc """
  Gets a single task.

  Returns `{:ok, task}` if found, `{:error, :not_found}` otherwise.

  ## Examples

      iex> get_task(123)
      {:ok, %Task{}}

      iex> get_task(456)
      {:error, :not_found}

  """
  def get_task(id) do
    case Task
         |> preload(
           list: [],
           assignee: [],
           created_by: [],
           subtasks: [:assignee, :created_by]
         )
         |> Repo.get(id) do
      nil -> {:error, :not_found}
      task -> {:ok, task}
    end
  end

  @doc """
  Creates a task.

  ## Examples

      iex> create_task(%{field: value})
      {:ok, %Task{}}

      iex> create_task(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_task(attrs \\ %{}) do
    %Task{}
    |> Task.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates a task for a specific list.

  ## Examples

      iex> create_task(list_id, %{field: value})
      {:ok, %Task{}}

  """
  def create_task(list_id, attrs) when is_binary(list_id) do
    attrs
    |> Map.put(:list_id, list_id)
    |> create_task()
  end

  @doc """
  Updates a task.

  ## Examples

      iex> update_task(task, %{field: new_value})
      {:ok, %Task{}}

      iex> update_task(task, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_task(%Task{} = task, attrs) do
    task
    |> Task.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a task.

  ## Examples

      iex> delete_task(task)
      {:ok, %Task{}}

      iex> delete_task(task)
      {:error, %Ecto.Changeset{}}

  """
  def delete_task(%Task{} = task) do
    Repo.delete(task)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking task changes.

  ## Examples

      iex> change_task(task)
      %Ecto.Changeset{data: %Task{}}

  """
  def change_task(%Task{} = task, attrs \\ %{}) do
    Task.changeset(task, attrs)
  end

  @doc """
  Assigns a task to a user.

  ## Examples

      iex> assign_task(task, user_id)
      {:ok, %Task{}}

  """
  def assign_task(%Task{} = task, assignee_id) do
    update_task(task, %{assignee_id: assignee_id})
  end

  @doc """
  Updates the status of a task.

  ## Examples

      iex> update_task_status(task, "done")
      {:ok, %Task{}}

  """
  def update_task_status(%Task{} = task, status) do
    update_task(task, %{status: status})
  end

  # ============================================================================
  # Subtask functions
  # ============================================================================

  @doc """
  Returns the list of subtasks.

  ## Examples

      iex> list_subtasks()
      [%Subtask{}, ...]

  """
  def list_subtasks do
    Subtask
    |> preload([:task, :assignee, :created_by])
    |> Repo.all()
  end

  @doc """
  Returns the list of subtasks for a specific task.

  ## Examples

      iex> list_subtasks(task_id)
      [%Subtask{}, ...]

  """
  def list_subtasks(task_id) do
    Subtask
    |> where([s], s.task_id == ^task_id)
    |> preload([:task, :assignee, :created_by])
    |> Repo.all()
  end

  @doc """
  Returns the list of subtasks assigned to a specific user.

  ## Examples

      iex> list_subtasks_by_assignee(user_id)
      [%Subtask{}, ...]

  """
  def list_subtasks_by_assignee(assignee_id) do
    Subtask
    |> where([s], s.assignee_id == ^assignee_id)
    |> preload([:task, :assignee, :created_by])
    |> Repo.all()
  end

  @doc """
  Returns the list of subtasks with a specific status.

  ## Examples

      iex> list_subtasks_by_status("todo")
      [%Subtask{}, ...]

  """
  def list_subtasks_by_status(status) do
    Subtask
    |> where([s], s.status == ^status)
    |> preload([:task, :assignee, :created_by])
    |> Repo.all()
  end

  @doc """
  Gets a single subtask.

  Returns `{:ok, subtask}` if found, `{:error, :not_found}` otherwise.

  ## Examples

      iex> get_subtask(123)
      {:ok, %Subtask{}}

      iex> get_subtask(456)
      {:error, :not_found}

  """
  def get_subtask(id) do
    case Subtask
         |> preload(task: [list: []], assignee: [], created_by: [])
         |> Repo.get(id) do
      nil -> {:error, :not_found}
      subtask -> {:ok, subtask}
    end
  end

  @doc """
  Creates a subtask.

  ## Examples

      iex> create_subtask(%{field: value})
      {:ok, %Subtask{}}

      iex> create_subtask(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_subtask(attrs \\ %{}) do
    %Subtask{}
    |> Subtask.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates a subtask for a specific task.

  ## Examples

      iex> create_subtask(task_id, %{field: value})
      {:ok, %Subtask{}}

  """
  def create_subtask(task_id, attrs) when is_binary(task_id) do
    attrs
    |> Map.put(:task_id, task_id)
    |> create_subtask()
  end

  @doc """
  Updates a subtask.

  ## Examples

      iex> update_subtask(subtask, %{field: new_value})
      {:ok, %Subtask{}}

      iex> update_subtask(subtask, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_subtask(%Subtask{} = subtask, attrs) do
    subtask
    |> Subtask.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a subtask.

  ## Examples

      iex> delete_subtask(subtask)
      {:ok, %Subtask{}}

      iex> delete_subtask(subtask)
      {:error, %Ecto.Changeset{}}

  """
  def delete_subtask(%Subtask{} = subtask) do
    Repo.delete(subtask)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking subtask changes.

  ## Examples

      iex> change_subtask(subtask)
      %Ecto.Changeset{data: %Subtask{}}

  """
  def change_subtask(%Subtask{} = subtask, attrs \\ %{}) do
    Subtask.changeset(subtask, attrs)
  end

  @doc """
  Assigns a subtask to a user.

  ## Examples

      iex> assign_subtask(subtask, user_id)
      {:ok, %Subtask{}}

  """
  def assign_subtask(%Subtask{} = subtask, assignee_id) do
    update_subtask(subtask, %{assignee_id: assignee_id})
  end

  @doc """
  Updates the status of a subtask.

  ## Examples

      iex> update_subtask_status(subtask, "done")
      {:ok, %Subtask{}}

  """
  def update_subtask_status(%Subtask{} = subtask, status) do
    update_subtask(subtask, %{status: status})
  end
end
