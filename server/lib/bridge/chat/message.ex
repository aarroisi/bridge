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

  # Allowed HTML tags for rich text formatting (matching TipTap StarterKit)
  @allowed_tags ~w(p br strong em u s ul ol li blockquote pre code h1 h2 h3 h4 h5 h6)

  @doc false
  def changeset(message, attrs) do
    message
    |> cast(attrs, [:text, :entity_type, :entity_id, :user_id, :parent_id, :quote_id])
    |> validate_required([:text, :entity_type, :entity_id, :user_id])
    |> validate_inclusion(:entity_type, ["task", "subtask", "doc", "channel", "dm"])
    |> sanitize_html()
  end

  # Sanitize HTML to prevent XSS attacks
  defp sanitize_html(changeset) do
    case get_change(changeset, :text) do
      nil ->
        changeset

      text ->
        sanitized_text = HtmlSanitizeEx.basic_html(text, tags: @allowed_tags, attributes: [])
        put_change(changeset, :text, sanitized_text)
    end
  end
end
