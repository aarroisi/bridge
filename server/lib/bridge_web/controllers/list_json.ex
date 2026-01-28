defmodule BridgeWeb.ListJSON do
  alias Bridge.Lists.List

  @doc """
  Renders a list of lists.
  """
  def index(%{lists: lists}) do
    %{data: for(list <- lists, do: data(list))}
  end

  @doc """
  Renders a single list.
  """
  def show(%{list: list}) do
    %{data: data(list)}
  end

  @doc """
  Renders errors.
  """
  def error(%{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  defp data(%List{} = list) do
    %{
      id: list.id,
      name: list.name,
      starred: list.starred,
      project_id: list.project_id,
      inserted_at: list.inserted_at,
      updated_at: list.updated_at
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
