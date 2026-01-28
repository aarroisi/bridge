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
    quote_data =
      if Ecto.assoc_loaded?(message.quote) and message.quote do
        %{
          id: message.quote.id,
          text: message.quote.text,
          user_name:
            if(Ecto.assoc_loaded?(message.quote.user), do: message.quote.user.name, else: nil),
          inserted_at: message.quote.inserted_at
        }
      else
        nil
      end

    %{
      id: message.id,
      text: message.text,
      entity_type: message.entity_type,
      entity_id: message.entity_id,
      user_id: message.user_id,
      user_name: if(Ecto.assoc_loaded?(message.user), do: message.user.name, else: nil),
      # TODO: Add avatar support
      avatar: "",
      parent_id: message.parent_id,
      quote_id: message.quote_id,
      quote: quote_data,
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
