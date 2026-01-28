defmodule BridgeWeb.WorkspaceMemberControllerTest do
  use BridgeWeb.ConnCase

  describe "index" do
    setup do
      workspace = insert(:workspace)
      owner = insert(:user, workspace_id: workspace.id, role: "owner")
      member = insert(:user, workspace_id: workspace.id, role: "member")
      guest = insert(:user, workspace_id: workspace.id, role: "guest")

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, owner.id)
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, workspace: workspace, owner: owner, member: member, guest: guest}
    end

    test "lists all workspace members for owner", %{
      conn: conn,
      owner: owner,
      member: member,
      guest: guest
    } do
      response =
        conn
        |> get(~p"/api/workspace/members")
        |> json_response(200)

      user_ids = Enum.map(response["data"], & &1["id"])
      assert owner.id in user_ids
      assert member.id in user_ids
      assert guest.id in user_ids
    end

    test "returns 403 for non-owners", %{conn: conn, member: member} do
      conn =
        conn
        |> put_session(:user_id, member.id)

      conn
      |> get(~p"/api/workspace/members")
      |> json_response(403)
    end
  end

  describe "create" do
    setup do
      workspace = insert(:workspace)
      owner = insert(:user, workspace_id: workspace.id, role: "owner")

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, owner.id)
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, workspace: workspace, owner: owner}
    end

    test "creates a new member", %{conn: conn} do
      user_params = %{
        name: "New User",
        email: "newuser@example.com",
        password: "password123",
        role: "member"
      }

      response =
        conn
        |> post(~p"/api/workspace/members", user: user_params)
        |> json_response(201)

      assert response["data"]["name"] == "New User"
      assert response["data"]["email"] == "newuser@example.com"
      assert response["data"]["role"] == "member"
    end

    test "creates a new guest", %{conn: conn} do
      user_params = %{
        name: "Guest User",
        email: "guest@example.com",
        password: "password123",
        role: "guest"
      }

      response =
        conn
        |> post(~p"/api/workspace/members", user: user_params)
        |> json_response(201)

      assert response["data"]["role"] == "guest"
    end

    test "returns error for invalid data", %{conn: conn} do
      user_params = %{name: "", email: "invalid"}

      response =
        conn
        |> post(~p"/api/workspace/members", user: user_params)
        |> json_response(422)

      assert response["errors"]["name"]
    end

    test "returns 403 for non-owners", %{conn: conn, workspace: workspace} do
      member = insert(:user, workspace_id: workspace.id, role: "member")

      conn =
        conn
        |> put_session(:user_id, member.id)

      conn
      |> post(~p"/api/workspace/members",
        user: %{name: "Test", email: "test@test.com", password: "pass123"}
      )
      |> json_response(403)
    end
  end

  describe "update" do
    setup do
      workspace = insert(:workspace)
      owner = insert(:user, workspace_id: workspace.id, role: "owner")
      member = insert(:user, workspace_id: workspace.id, role: "member")

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, owner.id)
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, workspace: workspace, owner: owner, member: member}
    end

    test "updates member role", %{conn: conn, member: member} do
      response =
        conn
        |> put(~p"/api/workspace/members/#{member.id}", user: %{role: "guest"})
        |> json_response(200)

      assert response["data"]["role"] == "guest"
    end

    test "returns 404 for user from another workspace", %{conn: conn} do
      other_workspace = insert(:workspace)
      other_user = insert(:user, workspace_id: other_workspace.id)

      conn
      |> put(~p"/api/workspace/members/#{other_user.id}", user: %{role: "guest"})
      |> json_response(404)
    end

    test "returns 403 for non-owners", %{conn: conn, workspace: workspace, member: member} do
      conn =
        conn
        |> put_session(:user_id, member.id)

      conn
      |> put(~p"/api/workspace/members/#{member.id}", user: %{role: "guest"})
      |> json_response(403)
    end
  end

  describe "delete" do
    setup do
      workspace = insert(:workspace)
      owner = insert(:user, workspace_id: workspace.id, role: "owner")
      member = insert(:user, workspace_id: workspace.id, role: "member")

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, owner.id)
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, workspace: workspace, owner: owner, member: member}
    end

    test "deletes a member", %{conn: conn, member: member} do
      conn
      |> delete(~p"/api/workspace/members/#{member.id}")
      |> response(204)
    end

    test "returns 404 for user from another workspace", %{conn: conn} do
      other_workspace = insert(:workspace)
      other_user = insert(:user, workspace_id: other_workspace.id)

      conn
      |> delete(~p"/api/workspace/members/#{other_user.id}")
      |> json_response(404)
    end

    test "returns 403 for non-owners", %{conn: conn, workspace: workspace, member: member} do
      conn =
        conn
        |> put_session(:user_id, member.id)

      conn
      |> delete(~p"/api/workspace/members/#{member.id}")
      |> json_response(403)
    end
  end
end
