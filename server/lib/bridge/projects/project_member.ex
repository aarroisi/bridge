defmodule Bridge.Projects.ProjectMember do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "project_members" do
    belongs_to(:user, Bridge.Accounts.User)
    belongs_to(:project, Bridge.Projects.Project)

    timestamps()
  end

  @doc false
  def changeset(project_member, attrs) do
    project_member
    |> cast(attrs, [:user_id, :project_id])
    |> validate_required([:user_id, :project_id])
    |> unique_constraint([:user_id, :project_id])
    |> foreign_key_constraint(:user_id)
    |> foreign_key_constraint(:project_id)
  end
end
