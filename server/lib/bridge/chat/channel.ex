defmodule Bridge.Chat.Channel do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "channels" do
    field(:name, :string)
    field(:starred, :boolean, default: false)

    belongs_to(:project, Bridge.Projects.Project)

    timestamps()
  end

  @doc false
  def changeset(channel, attrs) do
    channel
    |> cast(attrs, [:name, :starred, :project_id])
    |> validate_required([:name])
  end
end
