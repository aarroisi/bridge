defmodule BridgeWeb.DirectMessageJSON do
  alias Bridge.Chat.DirectMessage

  @doc """
  Renders a list of direct_messages.
  """
  def index(%{page: page}) do
    %{
      data: for(dm <- page.entries, do: data(dm)),
      metadata: %{
        after: page.metadata.after,
        before: page.metadata.before,
        limit: page.metadata.limit
      }
    }
  end

  def index(%{direct_messages: direct_messages}) do
    %{data: for(direct_message <- direct_messages, do: data(direct_message))}
  end

  @doc """
  Renders a single direct_message.
  """
  def show(%{direct_message: direct_message}) do
    %{data: data(direct_message)}
  end

  @doc """
  Renders errors.
  """
  def error(%{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  defp data(%DirectMessage{} = direct_message) do
    %{
      id: direct_message.id,
      starred: direct_message.starred,
      user1_id: direct_message.user1_id,
      user2_id: direct_message.user2_id,
      inserted_at: direct_message.inserted_at,
      updated_at: direct_message.updated_at
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
