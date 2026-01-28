defmodule Bridge.Docs.Doc do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]

  schema "docs" do
    field(:title, :string)
    field(:content, :string, default: "")
    field(:starred, :boolean, default: false)

    belongs_to(:workspace, Bridge.Accounts.Workspace)
    belongs_to(:project, Bridge.Projects.Project)
    belongs_to(:author, Bridge.Accounts.User)

    timestamps()
  end

  @doc false
  def changeset(doc, attrs) do
    doc
    |> cast(attrs, [:title, :content, :starred, :workspace_id, :project_id, :author_id])
    |> validate_required([:title, :workspace_id, :author_id])
  end
end
