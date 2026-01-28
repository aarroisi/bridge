defmodule Bridge.Projects.Project do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "projects" do
    field(:name, :string)
    field(:starred, :boolean, default: false)

    has_many(:lists, Bridge.Lists.List)
    has_many(:docs, Bridge.Docs.Doc)
    has_many(:channels, Bridge.Chat.Channel)

    timestamps()
  end

  @doc false
  def changeset(project, attrs) do
    project
    |> cast(attrs, [:name, :starred])
    |> validate_required([:name])
  end
end
