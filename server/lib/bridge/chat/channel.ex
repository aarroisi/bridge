defmodule Bridge.Chat.Channel do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "channels" do
    field(:name, :string)
    field(:starred, :boolean, default: false)

    belongs_to(:workspace, Bridge.Accounts.Workspace)
    belongs_to(:project, Bridge.Projects.Project)
    belongs_to(:created_by, Bridge.Accounts.User)

    timestamps()
  end

  @doc false
  def changeset(channel, attrs) do
    channel
    |> cast(attrs, [:name, :starred, :workspace_id, :project_id, :created_by_id])
    |> validate_required([:name, :workspace_id])
  end
end
