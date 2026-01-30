defmodule Bridge.Docs do
  @moduledoc """
  The Docs context.
  """

  import Ecto.Query, warn: false
  alias Bridge.Repo

  alias Bridge.Docs.Doc

  @doc """
  Returns the list of docs for a workspace.

  ## Examples

      iex> list_docs(workspace_id, user)
      [%Doc{}, ...]

  """
  def list_docs(workspace_id, _user, opts \\ []) do
    Doc
    |> where([d], d.workspace_id == ^workspace_id)
    |> order_by([d], desc: d.id)
    |> preload([:author])
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Returns the list of docs created by a specific author.

  ## Examples

      iex> list_docs_by_author(author_id)
      [%Doc{}, ...]

  """
  def list_docs_by_author(author_id, opts \\ []) do
    Doc
    |> where([d], d.author_id == ^author_id)
    |> order_by([d], desc: d.id)
    |> preload([:author])
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Returns the list of starred docs for a workspace.

  ## Examples

      iex> list_starred_docs(workspace_id)
      [%Doc{}, ...]

  """
  def list_starred_docs(workspace_id, opts \\ []) do
    Doc
    |> where([d], d.starred == true and d.workspace_id == ^workspace_id)
    |> order_by([d], desc: d.id)
    |> preload([:author])
    |> Repo.paginate(Keyword.merge([cursor_fields: [:id], limit: 50], opts))
  end

  @doc """
  Gets a single doc within a workspace.

  Returns `nil` if the Doc does not exist.

  ## Examples

      iex> get_doc(id, workspace_id)
      %Doc{}

      iex> get_doc(456, workspace_id)
      nil

  """
  def get_doc(id, workspace_id) do
    case Doc
         |> where([d], d.workspace_id == ^workspace_id)
         |> preload([:author])
         |> Repo.get(id) do
      nil -> {:error, :not_found}
      doc -> {:ok, doc}
    end
  end

  @doc """
  Creates a doc.

  ## Examples

      iex> create_doc(%{field: value})
      {:ok, %Doc{}}

      iex> create_doc(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_doc(attrs \\ %{}) do
    %Doc{}
    |> Doc.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a doc.

  ## Examples

      iex> update_doc(doc, %{field: new_value})
      {:ok, %Doc{}}

      iex> update_doc(doc, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_doc(%Doc{} = doc, attrs) do
    doc
    |> Doc.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a doc.

  ## Examples

      iex> delete_doc(doc)
      {:ok, %Doc{}}

      iex> delete_doc(doc)
      {:error, %Ecto.Changeset{}}

  """
  def delete_doc(%Doc{} = doc) do
    Repo.delete(doc)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking doc changes.

  ## Examples

      iex> change_doc(doc)
      %Ecto.Changeset{data: %Doc{}}

  """
  def change_doc(%Doc{} = doc, attrs \\ %{}) do
    Doc.changeset(doc, attrs)
  end

  @doc """
  Toggles the starred status of a doc.

  ## Examples

      iex> toggle_doc_starred(doc)
      {:ok, %Doc{}}

  """
  def toggle_doc_starred(%Doc{} = doc) do
    update_doc(doc, %{starred: !doc.starred})
  end

  @doc """
  Updates the content of a doc.

  ## Examples

      iex> update_doc_content(doc, "New content")
      {:ok, %Doc{}}

  """
  def update_doc_content(%Doc{} = doc, content) when is_binary(content) do
    update_doc(doc, %{content: content})
  end
end
