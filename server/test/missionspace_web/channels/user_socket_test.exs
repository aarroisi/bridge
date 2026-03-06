defmodule MissionspaceWeb.UserSocketTest do
  use MissionspaceWeb.ChannelCase, async: true

  alias MissionspaceWeb.{ListChannel, UserSocket}

  describe "connect/3" do
    test "connects with an authenticated session and assigns workspace context" do
      workspace = insert(:workspace)
      user = insert(:user, workspace_id: workspace.id)

      assert {:ok, socket} =
               connect(UserSocket, %{},
                 connect_info: %{session: %{user_id: user.id, workspace_id: workspace.id}}
               )

      assert socket.assigns.user_id == user.id
      assert socket.assigns.workspace_id == workspace.id
    end

    test "rejects unauthenticated sessions" do
      assert :error = connect(UserSocket, %{}, connect_info: %{session: %{}})
    end

    test "allows joining workspace-scoped channels after connect" do
      workspace = insert(:workspace)
      user = insert(:user, workspace_id: workspace.id)
      list = insert(:list, workspace_id: workspace.id)

      assert {:ok, socket} =
               connect(UserSocket, %{},
                 connect_info: %{session: %{user_id: user.id, workspace_id: workspace.id}}
               )

      assert {:ok, %{}, joined_socket} =
               subscribe_and_join(socket, ListChannel, "list:#{list.id}")

      assert joined_socket.assigns.list_id == list.id
    end
  end
end
