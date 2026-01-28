defmodule BridgeWeb.MessageJSON do
  alias Bridge.Chat.Message

  @doc """
  Renders a list of messages.
  """
  def index(%{messages: messages}) do
    %{data: for(message <- messages, do: data(message))}
  end

  @doc """
  Renders a single message.
  """
  def show(%{message: message}) do
    %{data: data(message)}
  end

  @doc """
  Renders errors.
  """
  def error(%{changeset: changeset}) do
    %{errors: translate_errors(changeset)}
  end

  defp data(%Message{} = message) do
    %{
      id: message.id,
      text: message.text,
      entity_type: message.entity_type,
      entity_id: message.entity_id,
      user_id: message.user_id,
      parent_id: message.parent_id,
      quote_id: message.quote_id,
      inserted_at: message.inserted_at,
      updated_at: message.updated_at
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
