defmodule Bridge.Lists.ListStatus do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "list_statuses" do
    field(:name, :string)
    field(:color, :string, default: "#6b7280")
    field(:position, :integer, default: 0)

    belongs_to(:list, Bridge.Lists.List)
    has_many(:tasks, Bridge.Lists.Task, foreign_key: :status_id)

    timestamps()
  end

  @doc false
  def changeset(status, attrs) do
    status
    |> cast(attrs, [:name, :color, :position, :list_id])
    |> validate_required([:name, :list_id])
    |> validate_format(:color, ~r/^#[0-9a-fA-F]{6}$/, message: "must be a valid hex color")
    |> unique_constraint([:list_id, :name],
      name: :list_statuses_list_id_name_index,
      message: "already exists in this list"
    )
  end
end
