defmodule Bridge.Lists.List do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]
  schema "lists" do
    field(:name, :string)
    field(:starred, :boolean, default: false)

    belongs_to(:project, Bridge.Projects.Project)
    has_many(:tasks, Bridge.Lists.Task)

    timestamps()
  end

  @doc false
  def changeset(list, attrs) do
    list
    |> cast(attrs, [:name, :starred, :project_id])
    |> validate_required([:name])
  end
end
