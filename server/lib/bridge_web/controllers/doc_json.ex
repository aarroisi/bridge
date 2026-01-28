defmodule BridgeWeb.DocJSON do
  alias Bridge.Docs.Doc

  @doc """
  Renders a list of docs.
  """
  def index(%{docs: docs}) do
    %{data: for(doc <- docs, do: data(doc))}
  end

  @doc """
  Renders a single doc.
  """
  def show(%{doc: doc}) do
    %{data: data(doc)}
  end

  @doc """
  Renders errors.
  """
  def error(%{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  defp data(%Doc{} = doc) do
    %{
      id: doc.id,
      title: doc.title,
      content: doc.content,
      starred: doc.starred,
      project_id: doc.project_id,
      author_id: doc.author_id,
      # TODO: Load from author relationship
      author_name: "User",
      inserted_at: DateTime.to_iso8601(doc.inserted_at),
      updated_at: DateTime.to_iso8601(doc.updated_at)
    }
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end
end
