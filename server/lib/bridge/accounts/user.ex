defmodule Bridge.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "users" do
    field(:name, :string)
    field(:email, :string)
    field(:avatar, :string)
    field(:online, :boolean, default: false)
    field(:password_hash, :string)
    field(:password, :string, virtual: true)
    field(:role, :string, default: "owner")

    belongs_to(:workspace, Bridge.Accounts.Workspace)
    has_many(:project_members, Bridge.Projects.ProjectMember)
    has_many(:projects, through: [:project_members, :project])

    timestamps()
  end

  @roles ["owner", "member", "guest"]

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :avatar, :online, :workspace_id, :role])
    |> validate_required([:name, :email])
    |> validate_format(:email, ~r/@/)
    |> validate_inclusion(:role, @roles)
    |> unique_constraint(:email)
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:name, :email, :password, :workspace_id, :role])
    |> validate_required([:name, :email, :password, :workspace_id])
    |> validate_format(:email, ~r/@/)
    |> validate_length(:password, min: 6)
    |> validate_inclusion(:role, @roles)
    |> unique_constraint(:email)
    |> put_password_hash()
  end

  defp put_password_hash(changeset) do
    case get_change(changeset, :password) do
      nil -> changeset
      password -> put_change(changeset, :password_hash, hash_password(password))
    end
  end

  def hash_password(password) do
    :crypto.hash(:sha256, password) |> Base.encode16(case: :lower)
  end

  def verify_password(user, password) do
    hash_password(password) == user.password_hash
  end
end
