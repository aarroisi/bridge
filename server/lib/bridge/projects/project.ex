defmodule Bridge.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "projects" do
    field(:name, :string)
    field(:starred, :boolean, default: false)

    belongs_to(:workspace, Bridge.Accounts.Workspace)
    has_many(:lists, Bridge.Lists.List)
    has_many(:docs, Bridge.Docs.Doc)
    has_many(:channels, Bridge.Chat.Channel)

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :starred, :workspace_id])
    |> validate_required([:name, :workspace_id])
  end
end
