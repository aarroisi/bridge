defmodule MissionspaceWeb.AuthControllerTest do
  use MissionspaceWeb.ConnCase

  describe "login" do
    setup %{conn: conn} do
      workspace = insert(:workspace)

      user =
        insert(:user,
          workspace_id: workspace.id,
          email: "login@example.com",
          password_hash: Missionspace.Accounts.User.hash_password("password123")
        )

      conn = put_req_header(conn, "accept", "application/json")

      {:ok, conn: conn, user: user}
    end

    test "sets a persistent session cookie", %{conn: conn, user: user} do
      conn =
        post(conn, ~p"/api/auth/login", %{
          email: user.email,
          password: "password123"
        })

      response = json_response(conn, 200)
      assert response["user"]["id"] == user.id

      session_cookie =
        conn
        |> get_resp_header("set-cookie")
        |> Enum.find(&String.starts_with?(&1, "_missionspace_key="))

      assert session_cookie
      assert session_cookie =~ ~r/max-age=1209600/i
      assert session_cookie =~ ~r/expires=/i
      assert get_session(conn, :account_user_ids) == [user.id]
    end
  end

  describe "accounts" do
    setup do
      workspace_1 = insert(:workspace)
      workspace_2 = insert(:workspace)
      user_1 = insert(:user, workspace_id: workspace_1.id)
      user_2 = insert(:user, workspace_id: workspace_2.id)

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, user_1.id)
        |> put_session(:workspace_id, workspace_1.id)
        |> put_session(:account_user_ids, [user_1.id, user_2.id])
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, user_1: user_1, user_2: user_2}
    end

    test "lists remembered accounts and marks current", %{
      conn: conn,
      user_1: user_1,
      user_2: user_2
    } do
      response =
        conn
        |> get(~p"/api/auth/accounts")
        |> json_response(200)

      assert length(response["data"]) == 2

      account_1 = Enum.find(response["data"], &(&1["user"]["id"] == user_1.id))
      account_2 = Enum.find(response["data"], &(&1["user"]["id"] == user_2.id))

      assert account_1["current"] == true
      assert account_2["current"] == false
    end
  end

  describe "switch_account" do
    setup do
      workspace_1 = insert(:workspace)
      workspace_2 = insert(:workspace)
      user_1 = insert(:user, workspace_id: workspace_1.id)
      user_2 = insert(:user, workspace_id: workspace_2.id)

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, user_1.id)
        |> put_session(:workspace_id, workspace_1.id)
        |> put_session(:account_user_ids, [user_1.id, user_2.id])
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, user_1: user_1, user_2: user_2}
    end

    test "switches to a remembered account", %{conn: conn, user_1: user_1, user_2: user_2} do
      conn =
        post(conn, ~p"/api/auth/switch-account", %{
          user_id: user_2.id
        })

      response = json_response(conn, 200)
      assert response["user"]["id"] == user_2.id
      assert get_session(conn, :user_id) == user_2.id
      assert get_session(conn, :workspace_id) == user_2.workspace_id
      assert get_session(conn, :account_user_ids) == [user_2.id, user_1.id]
    end

    test "rejects switching to a non-remembered account", %{conn: conn} do
      unknown_user = insert(:user)

      response =
        conn
        |> post(~p"/api/auth/switch-account", %{user_id: unknown_user.id})
        |> json_response(403)

      assert response["error"] == "account_not_available"
    end
  end

  describe "add_account" do
    setup do
      workspace = insert(:workspace)
      current_user = insert(:user, workspace_id: workspace.id)

      added_user =
        insert(:user,
          workspace_id: insert(:workspace).id,
          email: "second-login@example.com",
          password_hash: Missionspace.Accounts.User.hash_password("password123")
        )

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, current_user.id)
        |> put_session(:workspace_id, current_user.workspace_id)
        |> put_session(:account_user_ids, [current_user.id])
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, current_user: current_user, added_user: added_user}
    end

    test "adds another account without changing current session", %{
      conn: conn,
      current_user: current_user,
      added_user: added_user
    } do
      conn =
        post(conn, ~p"/api/auth/add-account", %{
          email: added_user.email,
          password: "password123"
        })

      response = json_response(conn, 200)
      assert response["data"]["user"]["id"] == added_user.id
      assert get_session(conn, :user_id) == current_user.id
      assert get_session(conn, :workspace_id) == current_user.workspace_id
      assert get_session(conn, :account_user_ids) == [added_user.id, current_user.id]
    end
  end

  describe "logout" do
    setup do
      workspace_1 = insert(:workspace)
      workspace_2 = insert(:workspace)
      user_1 = insert(:user, workspace_id: workspace_1.id)
      user_2 = insert(:user, workspace_id: workspace_2.id)

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, user_1.id)
        |> put_session(:workspace_id, workspace_1.id)
        |> put_session(:account_user_ids, [user_1.id, user_2.id])
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, user_2: user_2}
    end

    test "logs out current account and keeps other remembered accounts", %{
      conn: conn,
      user_2: user_2
    } do
      conn = post(conn, ~p"/api/auth/logout", %{})

      response = json_response(conn, 200)
      assert response["message"] == "Logged out successfully"
      assert get_session(conn, :user_id) == nil
      assert get_session(conn, :workspace_id) == nil
      assert get_session(conn, :account_user_ids) == [user_2.id]
    end
  end

  describe "update_me" do
    setup do
      workspace = insert(:workspace)
      user = insert(:user, workspace_id: workspace.id, name: "Old Name", email: "old@example.com")

      conn =
        build_conn()
        |> Plug.Test.init_test_session(%{})
        |> put_session(:user_id, user.id)
        |> put_req_header("accept", "application/json")

      {:ok, conn: conn, user: user, workspace: workspace}
    end

    test "updates user name successfully", %{conn: conn} do
      response =
        conn
        |> put(~p"/api/auth/me", user: %{name: "New Name"})
        |> json_response(200)

      assert response["user"]["name"] == "New Name"
    end

    test "updates user email successfully", %{conn: conn} do
      response =
        conn
        |> put(~p"/api/auth/me", user: %{email: "new@example.com"})
        |> json_response(200)

      assert response["user"]["email"] == "new@example.com"
    end

    test "updates user timezone successfully", %{conn: conn} do
      response =
        conn
        |> put(~p"/api/auth/me", user: %{timezone: "America/New_York"})
        |> json_response(200)

      assert response["user"]["timezone"] == "America/New_York"
    end

    test "updates both name and email at once", %{conn: conn} do
      response =
        conn
        |> put(~p"/api/auth/me", user: %{name: "New Name", email: "new@example.com"})
        |> json_response(200)

      assert response["user"]["name"] == "New Name"
      assert response["user"]["email"] == "new@example.com"
    end

    test "returns workspace info in response", %{conn: conn, workspace: workspace} do
      response =
        conn
        |> put(~p"/api/auth/me", user: %{name: "New Name"})
        |> json_response(200)

      assert response["workspace"]["id"] == workspace.id
      assert response["workspace"]["name"] == workspace.name
      assert response["workspace"]["slug"] == workspace.slug
    end

    test "returns error for invalid email format", %{conn: conn} do
      response =
        conn
        |> put(~p"/api/auth/me", user: %{email: "invalid"})
        |> json_response(422)

      assert response["errors"]["email"]
    end

    test "returns error for empty name", %{conn: conn} do
      response =
        conn
        |> put(~p"/api/auth/me", user: %{name: ""})
        |> json_response(422)

      assert response["errors"]["name"]
    end

    test "returns 401 when not authenticated" do
      conn =
        build_conn()
        |> put_req_header("accept", "application/json")

      conn
      |> put(~p"/api/auth/me", user: %{name: "Test"})
      |> json_response(401)
    end

    test "returns error for duplicate email", %{conn: conn, workspace: workspace} do
      _other_user = insert(:user, workspace_id: workspace.id, email: "taken@example.com")

      response =
        conn
        |> put(~p"/api/auth/me", user: %{email: "taken@example.com"})
        |> json_response(422)

      assert response["errors"]["email"]
    end
  end
end
