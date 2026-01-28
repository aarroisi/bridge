defmodule Bridge.Lists.Task do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "tasks" do
    field(:title, :string)
    field(:status, :string, default: "todo")
    field(:notes, :string)
    field(:due_on, :date)

    belongs_to(:list, Bridge.Lists.List)
    belongs_to(:assignee, Bridge.Accounts.User)
    belongs_to(:created_by, Bridge.Accounts.User)

    has_many(:subtasks, Bridge.Lists.Subtask)

    timestamps()
  end

  @doc false
  def changeset(task, attrs) do
    task
    |> cast(attrs, [:title, :status, :notes, :due_on, :list_id, :assignee_id, :created_by_id])
    |> validate_required([:title, :list_id, :created_by_id])
    |> validate_inclusion(:status, ["todo", "doing", "done"])
  end
end
