defmodule Bridge.Chat do
  @moduledoc """
  The Chat context.
  """

  import Ecto.Query, warn: false
  alias Bridge.Repo

  alias Bridge.Chat.{Channel, DirectMessage, Message}

  # ============================================================================
  # Channel functions
  # ============================================================================

  @doc """
  Returns the list of channels.

  ## Examples

      iex> list_channels()
      [%Channel{}, ...]

  """
  def list_channels do
    Channel
    |> preload([:project])
    |> Repo.all()
  end

  @doc """
  Returns the list of channels for a specific project.

  ## Examples

      iex> list_channels_by_project(project_id)
      [%Channel{}, ...]

  """
  def list_channels_by_project(project_id) do
    Channel
    |> where([c], c.project_id == ^project_id)
    |> preload([:project])
    |> Repo.all()
  end

  @doc """
  Returns the list of starred channels.

  ## Examples

      iex> list_starred_channels()
      [%Channel{}, ...]

  """
  def list_starred_channels do
    Channel
    |> where([c], c.starred == true)
    |> preload([:project])
    |> Repo.all()
  end

  @doc """
  Gets a single channel.

  Returns `nil` if the Channel does not exist.

  ## Examples

      iex> get_channel(123)
      %Channel{}

      iex> get_channel(456)
      nil

  """
  def get_channel(id) do
    Channel
    |> preload([:project])
    |> Repo.get(id)
  end

  @doc """
  Gets a single channel.

  Raises `Ecto.NoResultsError` if the Channel does not exist.

  ## Examples

      iex> get_channel!(123)
      %Channel{}

      iex> get_channel!(456)
      ** (Ecto.NoResultsError)

  """
  def get_channel!(id) do
    Channel
    |> preload([:project])
    |> Repo.get!(id)
  end

  @doc """
  Creates a channel.

  ## Examples

      iex> create_channel(%{field: value})
      {:ok, %Channel{}}

      iex> create_channel(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_channel(attrs \\ %{}) do
    %Channel{}
    |> Channel.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a channel.

  ## Examples

      iex> update_channel(channel, %{field: new_value})
      {:ok, %Channel{}}

      iex> update_channel(channel, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_channel(%Channel{} = channel, attrs) do
    channel
    |> Channel.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a channel.

  ## Examples

      iex> delete_channel(channel)
      {:ok, %Channel{}}

      iex> delete_channel(channel)
      {:error, %Ecto.Changeset{}}

  """
  def delete_channel(%Channel{} = channel) do
    Repo.delete(channel)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking channel changes.

  ## Examples

      iex> change_channel(channel)
      %Ecto.Changeset{data: %Channel{}}

  """
  def change_channel(%Channel{} = channel, attrs \\ %{}) do
    Channel.changeset(channel, attrs)
  end

  @doc """
  Toggles the starred status of a channel.

  ## Examples

      iex> toggle_channel_starred(channel)
      {:ok, %Channel{}}

  """
  def toggle_channel_starred(%Channel{} = channel) do
    update_channel(channel, %{starred: !channel.starred})
  end

  # ============================================================================
  # DirectMessage functions
  # ============================================================================

  @doc """
  Returns the list of direct messages.

  ## Examples

      iex> list_direct_messages()
      [%DirectMessage{}, ...]

  """
  def list_direct_messages do
    DirectMessage
    |> preload([:user1, :user2])
    |> Repo.all()
  end

  @doc """
  Returns the list of direct messages for a specific user.

  ## Examples

      iex> list_direct_messages_by_user(user_id)
      [%DirectMessage{}, ...]

  """
  def list_direct_messages_by_user(user_id) do
    DirectMessage
    |> where([dm], dm.user1_id == ^user_id or dm.user2_id == ^user_id)
    |> preload([:user1, :user2])
    |> Repo.all()
  end

  @doc """
  Returns the list of starred direct messages for a specific user.

  ## Examples

      iex> list_starred_direct_messages()
      [%DirectMessage{}, ...]

  """
  def list_starred_direct_messages do
    DirectMessage
    |> where([dm], dm.starred == true)
    |> preload([:user1, :user2])
    |> Repo.all()
  end

  @doc """
  Gets a single direct message.

  Returns `nil` if the Direct message does not exist.

  ## Examples

      iex> get_direct_message(123)
      %DirectMessage{}

      iex> get_direct_message(456)
      nil

  """
  def get_direct_message(id) do
    DirectMessage
    |> preload([:user1, :user2])
    |> Repo.get(id)
  end

  @doc """
  Gets a single direct message.

  Raises `Ecto.NoResultsError` if the Direct message does not exist.

  ## Examples

      iex> get_direct_message!(123)
      %DirectMessage{}

      iex> get_direct_message!(456)
      ** (Ecto.NoResultsError)

  """
  def get_direct_message!(id) do
    DirectMessage
    |> preload([:user1, :user2])
    |> Repo.get!(id)
  end

  @doc """
  Gets a direct message between two users.

  Returns `nil` if the direct message does not exist.

  ## Examples

      iex> get_direct_message_between(user1_id, user2_id)
      %DirectMessage{}

      iex> get_direct_message_between(user1_id, user3_id)
      nil

  """
  def get_direct_message_between(user1_id, user2_id) do
    DirectMessage
    |> where(
      [dm],
      (dm.user1_id == ^user1_id and dm.user2_id == ^user2_id) or
        (dm.user1_id == ^user2_id and dm.user2_id == ^user1_id)
    )
    |> preload([:user1, :user2])
    |> Repo.one()
  end

  @doc """
  Creates a direct message.

  ## Examples

      iex> create_direct_message(%{field: value})
      {:ok, %DirectMessage{}}

      iex> create_direct_message(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_direct_message(attrs \\ %{}) do
    %DirectMessage{}
    |> DirectMessage.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates or gets a direct message between two users.

  ## Examples

      iex> create_or_get_direct_message(user1_id, user2_id)
      {:ok, %DirectMessage{}}

  """
  def create_or_get_direct_message(user1_id, user2_id) do
    case get_direct_message_between(user1_id, user2_id) do
      nil -> create_direct_message(%{user1_id: user1_id, user2_id: user2_id})
      dm -> {:ok, dm}
    end
  end

  @doc """
  Updates a direct message.

  ## Examples

      iex> update_direct_message(direct_message, %{field: new_value})
      {:ok, %DirectMessage{}}

      iex> update_direct_message(direct_message, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_direct_message(%DirectMessage{} = direct_message, attrs) do
    direct_message
    |> DirectMessage.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a direct message.

  ## Examples

      iex> delete_direct_message(direct_message)
      {:ok, %DirectMessage{}}

      iex> delete_direct_message(direct_message)
      {:error, %Ecto.Changeset{}}

  """
  def delete_direct_message(%DirectMessage{} = direct_message) do
    Repo.delete(direct_message)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking direct message changes.

  ## Examples

      iex> change_direct_message(direct_message)
      %Ecto.Changeset{data: %DirectMessage{}}

  """
  def change_direct_message(%DirectMessage{} = direct_message, attrs \\ %{}) do
    DirectMessage.changeset(direct_message, attrs)
  end

  @doc """
  Toggles the starred status of a direct message.

  ## Examples

      iex> toggle_direct_message_starred(direct_message)
      {:ok, %DirectMessage{}}

  """
  def toggle_direct_message_starred(%DirectMessage{} = direct_message) do
    update_direct_message(direct_message, %{starred: !direct_message.starred})
  end

  # ============================================================================
  # Message functions
  # ============================================================================

  @doc """
  Returns the list of messages.

  ## Examples

      iex> list_messages()
      [%Message{}, ...]

  """
  def list_messages do
    Message
    |> preload([:user, :parent, :quote])
    |> order_by([m], asc: m.inserted_at)
    |> Repo.all()
  end

  @doc """
  Returns the list of messages for a specific entity (task, subtask, doc, channel, or dm).

  ## Examples

      iex> list_messages_by_entity("channel", channel_id)
      [%Message{}, ...]

  """
  def list_messages_by_entity(entity_type, entity_id) do
    Message
    |> where([m], m.entity_type == ^entity_type and m.entity_id == ^entity_id)
    |> preload([:user, :parent, :quote])
    |> order_by([m], asc: m.inserted_at)
    |> Repo.all()
  end

  @doc """
  Returns the list of messages sent by a specific user.

  ## Examples

      iex> list_messages_by_user(user_id)
      [%Message{}, ...]

  """
  def list_messages_by_user(user_id) do
    Message
    |> where([m], m.user_id == ^user_id)
    |> preload([:user, :parent, :quote])
    |> order_by([m], desc: m.inserted_at)
    |> Repo.all()
  end

  @doc """
  Returns the list of reply messages for a specific parent message.

  ## Examples

      iex> list_message_replies(parent_id)
      [%Message{}, ...]

  """
  def list_message_replies(parent_id) do
    Message
    |> where([m], m.parent_id == ^parent_id)
    |> preload([:user, :parent, :quote])
    |> order_by([m], asc: m.inserted_at)
    |> Repo.all()
  end

  @doc """
  Gets a single message.

  Returns `nil` if the Message does not exist.

  ## Examples

      iex> get_message(123)
      %Message{}

      iex> get_message(456)
      nil

  """
  def get_message(id) do
    Message
    |> preload([:user, :parent, :quote])
    |> Repo.get(id)
  end

  @doc """
  Gets a single message.

  Raises `Ecto.NoResultsError` if the Message does not exist.

  ## Examples

      iex> get_message!(123)
      %Message{}

      iex> get_message!(456)
      ** (Ecto.NoResultsError)

  """
  def get_message!(id) do
    Message
    |> preload([:user, :parent, :quote])
    |> Repo.get!(id)
  end

  @doc """
  Creates a message.

  ## Examples

      iex> create_message(%{field: value})
      {:ok, %Message{}}

      iex> create_message(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_message(attrs \\ %{}) do
    %Message{}
    |> Message.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Creates a message for a specific entity.

  ## Examples

      iex> create_message_for_entity("channel", channel_id, user_id, "Hello!")
      {:ok, %Message{}}

  """
  def create_message_for_entity(entity_type, entity_id, user_id, text, opts \\ %{}) do
    attrs =
      %{
        entity_type: entity_type,
        entity_id: entity_id,
        user_id: user_id,
        text: text
      }
      |> Map.merge(opts)

    create_message(attrs)
  end

  @doc """
  Updates a message.

  ## Examples

      iex> update_message(message, %{field: new_value})
      {:ok, %Message{}}

      iex> update_message(message, %{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def update_message(%Message{} = message, attrs) do
    message
    |> Message.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a message.

  ## Examples

      iex> delete_message(message)
      {:ok, %Message{}}

      iex> delete_message(message)
      {:error, %Ecto.Changeset{}}

  """
  def delete_message(%Message{} = message) do
    Repo.delete(message)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking message changes.

  ## Examples

      iex> change_message(message)
      %Ecto.Changeset{data: %Message{}}

  """
  def change_message(%Message{} = message, attrs \\ %{}) do
    Message.changeset(message, attrs)
  end

  @doc """
  Updates the text of a message.

  ## Examples

      iex> update_message_text(message, "Updated text")
      {:ok, %Message{}}

  """
  def update_message_text(%Message{} = message, text) when is_binary(text) do
    update_message(message, %{text: text})
  end
end
