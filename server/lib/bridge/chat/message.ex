defmodule Bridge.Chat.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, UUIDv7, autogenerate: true}
  @foreign_key_type Ecto.UUID
  @timestamps_opts [type: :utc_datetime_usec]
  schema "messages" do
    field(:text, :string)
    field(:entity_type, :string)
    field(:entity_id, :binary_id)

    belongs_to(:user, Bridge.Accounts.User)
    belongs_to(:parent, Bridge.Chat.Message)
    belongs_to(:quote, Bridge.Chat.Message)

    timestamps()
  end

  @doc false
  def changeset(message, attrs) do
    message
    |> cast(attrs, [:text, :entity_type, :entity_id, :user_id, :parent_id, :quote_id])
    |> validate_required([:text, :entity_type, :entity_id, :user_id])
    |> validate_inclusion(:entity_type, ["task", "subtask", "doc", "channel", "dm"])
  end
end
