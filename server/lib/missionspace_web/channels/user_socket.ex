defmodule MissionspaceWeb.UserSocket do
  use Phoenix.Socket

  alias Missionspace.Accounts

  # Define channels
  channel("list:*", MissionspaceWeb.ListChannel)
  channel("task:*", MissionspaceWeb.TaskChannel)
  channel("doc:*", MissionspaceWeb.DocChannel)
  channel("channel:*", MissionspaceWeb.ChatChannel)
  channel("dm:*", MissionspaceWeb.ChatChannel)
  channel("notifications:*", MissionspaceWeb.NotificationChannel)

  @impl true
  def connect(_params, socket, %{session: session}) when is_map(session) do
    with {:ok, user_id} <- fetch_session_value(session, :user_id),
         {:ok, user} <- Accounts.get_user(user_id),
         :ok <- validate_user(user),
         {:ok, workspace_id} <- resolve_workspace_id(session, user.workspace_id) do
      {:ok,
       socket
       |> assign(:user_id, user.id)
       |> assign(:workspace_id, workspace_id)}
    else
      _ -> :error
    end
  end

  def connect(_params, _socket, _connect_info) do
    :error
  end

  defp fetch_session_value(session, key) do
    case Map.get(session, key) || Map.get(session, Atom.to_string(key)) do
      value when is_binary(value) -> {:ok, value}
      _ -> :error
    end
  end

  defp resolve_workspace_id(session, user_workspace_id) when is_binary(user_workspace_id) do
    case Map.get(session, :workspace_id) || Map.get(session, "workspace_id") do
      nil -> {:ok, user_workspace_id}
      ^user_workspace_id -> {:ok, user_workspace_id}
      _ -> :error
    end
  end

  defp resolve_workspace_id(_session, _user_workspace_id), do: :error

  defp validate_user(user) do
    cond do
      not user.is_active -> :error
      is_nil(user.email_verified_at) -> :error
      is_nil(user.workspace_id) -> :error
      true -> :ok
    end
  end

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     Elixir.MissionspaceWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  @impl true
  def id(socket), do: "user_socket:#{socket.assigns.user_id}"
end
