defmodule Bridge.Lists.List do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "lists" do
    field(:name, :string)
    field(:starred, :boolean, default: false)

    belongs_to(:workspace, Bridge.Accounts.Workspace)
    belongs_to(:project, Bridge.Projects.Project)
    has_many(:tasks, Bridge.Lists.Task)

    timestamps()
  end

  @doc false
  def changeset(list, attrs) do
    list
    |> cast(attrs, [:name, :starred, :workspace_id, :project_id])
    |> validate_required([:name, :workspace_id])
  end
end
