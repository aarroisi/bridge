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

  # Allowed HTML tags for rich text formatting (matching TipTap StarterKit)
  @allowed_tags ~w(p br strong em u s ul ol li blockquote pre code h1 h2 h3 h4 h5 h6)

  @doc false
  def changeset(doc, attrs) do
    doc
    |> cast(attrs, [:title, :content, :starred, :workspace_id, :project_id, :author_id])
    |> validate_required([:title, :workspace_id, :author_id])
    |> sanitize_html()
  end

  # Sanitize HTML content to prevent XSS attacks
  defp sanitize_html(changeset) do
    case get_change(changeset, :content) do
      nil ->
        changeset

      content ->
        sanitized_content =
          HtmlSanitizeEx.basic_html(content, tags: @allowed_tags, attributes: [])

        put_change(changeset, :content, sanitized_content)
    end
  end
end
