defmodule Bridge.Docs do
  @moduledoc """
  The Docs context.
  """

  import Ecto.Query, warn: false
  alias Bridge.Repo

  alias Bridge.Docs.Doc

  @doc """
  Returns the list of docs.

  ## Examples

      iex> list_docs()
      [%Doc{}, ...]

  """
  def list_docs do
    Doc
    |> preload([:project, :author])
    |> Repo.all()
  end

  @doc """
  Returns the list of docs for a specific project.

  ## Examples

      iex> list_docs_by_project(project_id)
      [%Doc{}, ...]

  """
  def list_docs_by_project(project_id) do
    Doc
    |> where([d], d.project_id == ^project_id)
    |> preload([:project, :author])
    |> Repo.all()
  end

  @doc """
  Returns the list of docs created by a specific author.

  ## Examples

      iex> list_docs_by_author(author_id)
      [%Doc{}, ...]

  """
  def list_docs_by_author(author_id) do
    Doc
    |> where([d], d.author_id == ^author_id)
    |> preload([:project, :author])
    |> Repo.all()
  end

  @doc """
  Returns the list of starred docs.

  ## Examples

      iex> list_starred_docs()
      [%Doc{}, ...]

  """
  def list_starred_docs do
    Doc
    |> where([d], d.starred == true)
    |> preload([:project, :author])
    |> Repo.all()
  end

  @doc """
  Gets a single doc.

  Returns `nil` if the Doc does not exist.

  ## Examples

      iex> get_doc(123)
      %Doc{}

      iex> get_doc(456)
      nil

  """
  def get_doc(id) do
    Doc
    |> preload([:project, :author])
    |> Repo.get(id)
  end

  @doc """
  Gets a single doc.

  Raises `Ecto.NoResultsError` if the Doc does not exist.

  ## Examples

      iex> get_doc!(123)
      %Doc{}

      iex> get_doc!(456)
      ** (Ecto.NoResultsError)

  """
  def get_doc!(id) do
    Doc
    |> preload([:project, :author])
    |> Repo.get!(id)
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
