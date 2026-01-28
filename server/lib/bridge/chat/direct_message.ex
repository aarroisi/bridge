defmodule Bridge.Chat.DirectMessage do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  @timestamps_opts [type: :utc_datetime_usec]
  schema "direct_messages" do
    field(:starred, :boolean, default: false)

    belongs_to(:user1, Bridge.Accounts.User)
    belongs_to(:user2, Bridge.Accounts.User)

    timestamps()
  end

  @doc false
  def changeset(direct_message, attrs) do
    direct_message
    |> cast(attrs, [:starred, :user1_id, :user2_id])
    |> validate_required([:user1_id, :user2_id])
    |> unique_constraint([:user1_id, :user2_id])
  end
end
