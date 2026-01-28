defmodule BridgeWeb.ListControllerTest do
  use BridgeWeb.ConnCase

  setup do
    workspace = insert(:workspace)
    user = insert(:user, workspace_id: workspace.id)
    project = insert(:project, workspace_id: workspace.id)

    conn =
      build_conn()
      |> Plug.Test.init_test_session(%{})
      |> put_session(:user_id, user.id)
      |> put_req_header("accept", "application/json")

    {:ok, conn: conn, workspace: workspace, user: user, project: project}
  end

  describe "index" do
    test "returns all lists in workspace", %{conn: conn, workspace: workspace, project: project} do
      list1 = insert(:list, workspace_id: workspace.id, project_id: project.id)
      list2 = insert(:list, workspace_id: workspace.id, project_id: project.id)

      response =
        conn
        |> get(~p"/api/lists")
        |> json_response(200)

      list_ids = Enum.map(response["data"], & &1["id"])
      assert list1.id in list_ids
      assert list2.id in list_ids
    end

    test "does not return lists from other workspaces", %{
      conn: conn,
      workspace: workspace,
      project: project
    } do
      other_workspace = insert(:workspace)
      other_project = insert(:project, workspace_id: other_workspace.id)
      _list_in_workspace = insert(:list, workspace_id: workspace.id, project_id: project.id)
      other_list = insert(:list, workspace_id: other_workspace.id, project_id: other_project.id)

      response =
        conn
        |> get(~p"/api/lists")
        |> json_response(200)

      list_ids = Enum.map(response["data"], & &1["id"])
      refute other_list.id in list_ids
    end

    test "returns empty list when no lists exist", %{conn: conn} do
      response =
        conn
        |> get(~p"/api/lists")
        |> json_response(200)

      assert response["data"] == []
    end

    test "returns paginated results with correct metadata", %{
      conn: conn,
      workspace: workspace,
      project: project
    } do
      # Create 5 lists
      for _ <- 1..5 do
        insert(:list, workspace_id: workspace.id, project_id: project.id)
      end

      response =
        conn
        |> get(~p"/api/lists?limit=2")
        |> json_response(200)

      assert length(response["data"]) == 2
      assert response["metadata"]["limit"] == 2
      assert is_binary(response["metadata"]["after"]) or is_nil(response["metadata"]["after"])
      assert is_nil(response["metadata"]["before"])
    end
  end

  describe "create" do
    test "creates list with valid attributes", %{conn: conn, project: project} do
      list_params = %{
        name: "New List",
        starred: false,
        project_id: project.id
      }

      response =
        conn
        |> post(~p"/api/lists", list: list_params)
        |> json_response(201)

      assert response["data"]["name"] == "New List"
      assert response["data"]["starred"] == false
      assert response["data"]["project_id"] == project.id
      assert response["data"]["id"]
    end

    test "created list appears in index", %{conn: conn, project: project} do
      list_params = %{
        name: "Test List",
        project_id: project.id
      }

      create_response =
        conn
        |> post(~p"/api/lists", list: list_params)
        |> json_response(201)

      list_id = create_response["data"]["id"]

      index_response =
        conn
        |> get(~p"/api/lists")
        |> json_response(200)

      list_ids = Enum.map(index_response["data"], & &1["id"])
      assert list_id in list_ids
    end

    test "returns error with invalid attributes", %{conn: conn} do
      list_params = %{
        name: ""
      }

      response =
        conn
        |> post(~p"/api/lists", list: list_params)
        |> json_response(422)

      assert response["errors"]["name"]
    end

    test "sets workspace to current user's workspace", %{
      conn: conn,
      workspace: workspace,
      project: project
    } do
      other_workspace = insert(:workspace)

      list_params = %{
        name: "Test List",
        project_id: project.id
      }

      create_response =
        conn
        |> post(~p"/api/lists", list: list_params)
        |> json_response(201)

      list_id = create_response["data"]["id"]

      # Verify the list appears in current workspace's list
      index_response =
        conn
        |> get(~p"/api/lists")
        |> json_response(200)

      list_ids = Enum.map(index_response["data"], & &1["id"])
      assert list_id in list_ids

      # Verify it's actually stored with the correct workspace_id
      list = Bridge.Repo.get!(Bridge.Lists.List, list_id)
      assert list.workspace_id == workspace.id
      refute list.workspace_id == other_workspace.id
    end
  end

  describe "show" do
    test "returns list by id", %{conn: conn, workspace: workspace, project: project} do
      list = insert(:list, workspace_id: workspace.id, project_id: project.id)

      response =
        conn
        |> get(~p"/api/lists/#{list.id}")
        |> json_response(200)

      assert response["data"]["id"] == list.id
      assert response["data"]["name"] == list.name
      assert response["data"]["starred"] == list.starred
      assert response["data"]["project_id"] == project.id
    end

    test "returns 404 for non-existent list", %{conn: conn} do
      conn
      |> get(~p"/api/lists/00000000-0000-0000-0000-000000000000")
      |> json_response(404)
    end

    test "returns 404 for list from another workspace", %{conn: conn} do
      other_workspace = insert(:workspace)
      other_project = insert(:project, workspace_id: other_workspace.id)
      other_list = insert(:list, workspace_id: other_workspace.id, project_id: other_project.id)

      conn
      |> get(~p"/api/lists/#{other_list.id}")
      |> json_response(404)
    end
  end

  describe "update" do
    test "updates list with valid attributes", %{
      conn: conn,
      workspace: workspace,
      project: project
    } do
      list =
        insert(:list,
          workspace_id: workspace.id,
          project_id: project.id,
          name: "Old Name",
          starred: false
        )

      update_params = %{
        name: "New Name",
        starred: true
      }

      response =
        conn
        |> put(~p"/api/lists/#{list.id}", list: update_params)
        |> json_response(200)

      assert response["data"]["name"] == "New Name"
      assert response["data"]["starred"] == true
    end

    test "updated list reflects changes in show", %{
      conn: conn,
      workspace: workspace,
      project: project
    } do
      list = insert(:list, workspace_id: workspace.id, project_id: project.id, name: "Old Name")

      update_params = %{name: "Updated Name"}

      conn
      |> put(~p"/api/lists/#{list.id}", list: update_params)
      |> json_response(200)

      show_response =
        conn
        |> get(~p"/api/lists/#{list.id}")
        |> json_response(200)

      assert show_response["data"]["name"] == "Updated Name"
    end

    test "returns error with invalid attributes", %{
      conn: conn,
      workspace: workspace,
      project: project
    } do
      list = insert(:list, workspace_id: workspace.id, project_id: project.id)

      update_params = %{
        name: ""
      }

      response =
        conn
        |> put(~p"/api/lists/#{list.id}", list: update_params)
        |> json_response(422)

      assert response["errors"]["name"]
    end

    test "returns 404 for non-existent list", %{conn: conn} do
      update_params = %{name: "New Name"}

      conn
      |> put(~p"/api/lists/00000000-0000-0000-0000-000000000000", list: update_params)
      |> json_response(404)
    end

    test "returns 404 when updating list from another workspace", %{conn: conn} do
      other_workspace = insert(:workspace)
      other_project = insert(:project, workspace_id: other_workspace.id)
      other_list = insert(:list, workspace_id: other_workspace.id, project_id: other_project.id)

      update_params = %{name: "Hacked Name"}

      conn
      |> put(~p"/api/lists/#{other_list.id}", list: update_params)
      |> json_response(404)
    end
  end

  describe "delete" do
    test "deletes list", %{conn: conn, workspace: workspace, project: project} do
      list = insert(:list, workspace_id: workspace.id, project_id: project.id)

      conn
      |> delete(~p"/api/lists/#{list.id}")
      |> response(204)
    end

    test "deleted list no longer appears in index", %{
      conn: conn,
      workspace: workspace,
      project: project
    } do
      list = insert(:list, workspace_id: workspace.id, project_id: project.id)

      conn
      |> delete(~p"/api/lists/#{list.id}")
      |> response(204)

      index_response =
        conn
        |> get(~p"/api/lists")
        |> json_response(200)

      list_ids = Enum.map(index_response["data"], & &1["id"])
      refute list.id in list_ids
    end

    test "deleted list returns 404 on show", %{conn: conn, workspace: workspace, project: project} do
      list = insert(:list, workspace_id: workspace.id, project_id: project.id)

      conn
      |> delete(~p"/api/lists/#{list.id}")
      |> response(204)

      conn
      |> get(~p"/api/lists/#{list.id}")
      |> json_response(404)
    end

    test "returns 404 for non-existent list", %{conn: conn} do
      conn
      |> delete(~p"/api/lists/00000000-0000-0000-0000-000000000000")
      |> json_response(404)
    end

    test "returns 404 when deleting list from another workspace", %{conn: conn} do
      other_workspace = insert(:workspace)
      other_project = insert(:project, workspace_id: other_workspace.id)
      other_list = insert(:list, workspace_id: other_workspace.id, project_id: other_project.id)

      conn
      |> delete(~p"/api/lists/#{other_list.id}")
      |> json_response(404)
    end
  end
end
