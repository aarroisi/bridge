defmodule Bridge.Lists.Subtask do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "subtasks" do
    field(:title, :string)
    field(:status, :string, default: "todo")
    field(:notes, :string)

    belongs_to(:task, Bridge.Lists.Task)
    belongs_to(:assignee, Bridge.Accounts.User)
    belongs_to(:created_by, Bridge.Accounts.User)

    timestamps()
  end

  @doc false
  def changeset(subtask, attrs) do
    subtask
    |> cast(attrs, [:title, :status, :notes, :task_id, :assignee_id, :created_by_id])
    |> validate_required([:title, :task_id, :created_by_id])
    |> validate_inclusion(:status, ["todo", "doing", "done"])
  end
end
