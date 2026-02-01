defmodule Bridge.Lists.Task do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "tasks" do
    field(:title, :string)
    field(:position, :integer, default: 0)
    field(:notes, :string)
    field(:due_on, :date)
    field(:completed_at, :utc_datetime_usec)
    field(:comment_count, :integer, virtual: true, default: 0)

    belongs_to(:list, Bridge.Lists.List)
    belongs_to(:status, Bridge.Lists.ListStatus)
    belongs_to(:assignee, Bridge.Accounts.User)
    belongs_to(:created_by, Bridge.Accounts.User)

    has_many(:subtasks, Bridge.Lists.Subtask)

    timestamps()
  end

  @doc false
  def changeset(task, attrs) do
    task
    |> cast(attrs, [
      :title,
      :position,
      :notes,
      :due_on,
      :completed_at,
      :list_id,
      :status_id,
      :assignee_id,
      :created_by_id
    ])
    |> validate_required([:title, :list_id, :created_by_id])
    |> foreign_key_constraint(:status_id)
  end
end
