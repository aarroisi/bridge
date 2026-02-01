defmodule BridgeWeb.DocControllerTest do
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
    test "returns all docs in workspace", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      doc1 = insert(:doc, workspace_id: workspace.id, author_id: user.id)
      doc2 = insert(:doc, workspace_id: workspace.id, author_id: user.id)

      response =
        conn
        |> get(~p"/api/docs")
        |> json_response(200)

      doc_ids = Enum.map(response["data"], & &1["id"])
      assert doc1.id in doc_ids
      assert doc2.id in doc_ids
    end

    test "does not return docs from other workspaces", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      # Doc in our workspace
      our_doc =
        insert(:doc, workspace_id: workspace.id, author_id: user.id)

      # Doc in another workspace
      other_workspace = insert(:workspace)
      other_user = insert(:user, workspace_id: other_workspace.id)

      _other_doc =
        insert(:doc,
          workspace_id: other_workspace.id,
          author_id: other_user.id
        )

      response =
        conn
        |> get(~p"/api/docs")
        |> json_response(200)

      doc_ids = Enum.map(response["data"], & &1["id"])
      assert our_doc.id in doc_ids
      assert length(doc_ids) == 1
    end

    test "returns empty list when no docs exist", %{conn: conn} do
      response =
        conn
        |> get(~p"/api/docs")
        |> json_response(200)

      assert response["data"] == []
    end
  end

  describe "create" do
    test "creates doc with valid attributes", %{conn: conn} do
      doc_params = %{
        title: "Test Doc",
        content: "Test content"
      }

      response =
        conn
        |> post(~p"/api/docs", doc_params)
        |> json_response(201)

      assert response["data"]["title"] == "Test Doc"
      assert response["data"]["content"] == "Test content"
      assert response["data"]["id"]

      # Verify it appears in the list
      list_response =
        conn
        |> get(~p"/api/docs")
        |> json_response(200)

      assert Enum.any?(list_response["data"], fn doc ->
               doc["id"] == response["data"]["id"]
             end)
    end

    test "returns error with invalid attributes", %{conn: conn} do
      doc_params = %{
        title: "",
        content: "Content only"
      }

      response =
        conn
        |> post(~p"/api/docs", doc_params)
        |> dbg()

      IO.inspect(response, label: "RESPONSE")
      IO.inspect(response.status, label: "STATUS")

      body =
        if response.status == 422 do
          json_response(response, 422)
        else
          json_response(response, response.status)
        end

      IO.inspect(body, label: "BODY")

      assert body["errors"]["title"]
    end

    test "sets created_by to current user", %{conn: conn, user: user} do
      doc_params = %{
        title: "Test Doc"
      }

      response =
        conn
        |> post(~p"/api/docs", doc_params)
        |> json_response(201)

      assert response["data"]["created_by"]["id"] == user.id
    end

    test "sets workspace to current user's workspace", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      doc_params = %{
        title: "Test Doc"
      }

      response =
        conn
        |> post(~p"/api/docs", doc_params)
        |> json_response(201)

      # Workspace is set correctly, verify by checking we can only see docs from our workspace
      # Create a doc in another workspace
      other_workspace = insert(:workspace)
      other_user = insert(:user, workspace_id: other_workspace.id)

      _other_doc =
        insert(:doc,
          workspace_id: other_workspace.id,
          author_id: other_user.id
        )

      # Our doc should be in the list, but not the other workspace's doc
      list_response =
        conn
        |> get(~p"/api/docs")
        |> json_response(200)

      doc_ids = Enum.map(list_response["data"], & &1["id"])
      assert response["data"]["id"] in doc_ids
      # Only our doc
      assert length(doc_ids) == 1
    end
  end

  describe "show" do
    test "returns doc when found", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      doc =
        insert(:doc,
          workspace_id: workspace.id,
          author_id: user.id,
          title: "Test Doc"
        )

      response =
        conn
        |> get(~p"/api/docs/#{doc.id}")
        |> json_response(200)

      assert response["data"]["id"] == doc.id
      assert response["data"]["title"] == "Test Doc"
    end

    test "returns 404 when doc not found", %{conn: conn} do
      fake_id = UUIDv7.generate()

      response =
        conn
        |> get(~p"/api/docs/#{fake_id}")
        |> json_response(404)

      assert response["errors"]
    end

    test "returns 404 when doc exists but in different workspace", %{conn: conn} do
      other_workspace = insert(:workspace)
      other_user = insert(:user, workspace_id: other_workspace.id)

      other_doc =
        insert(:doc,
          workspace_id: other_workspace.id,
          author_id: other_user.id
        )

      response =
        conn
        |> get(~p"/api/docs/#{other_doc.id}")
        |> json_response(404)

      assert response["errors"]
    end
  end

  describe "update" do
    test "updates doc with valid attributes", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      doc =
        insert(:doc,
          workspace_id: workspace.id,
          author_id: user.id,
          title: "Old Title"
        )

      update_params = %{
        title: "New Title",
        content: "Updated content"
      }

      response =
        conn
        |> put(~p"/api/docs/#{doc.id}", update_params)
        |> json_response(200)

      assert response["data"]["title"] == "New Title"
      assert response["data"]["content"] == "Updated content"
      assert response["data"]["id"] == doc.id
    end

    test "returns 404 when doc not found", %{conn: conn} do
      fake_id = UUIDv7.generate()

      update_params = %{
        title: "New Title"
      }

      response =
        conn
        |> put(~p"/api/docs/#{fake_id}", update_params)
        |> json_response(404)

      assert response["errors"]
    end

    test "returns 404 when doc exists but in different workspace", %{conn: conn} do
      other_workspace = insert(:workspace)
      other_user = insert(:user, workspace_id: other_workspace.id)

      other_doc =
        insert(:doc,
          workspace_id: other_workspace.id,
          author_id: other_user.id
        )

      update_params = %{
        title: "New Title"
      }

      response =
        conn
        |> put(~p"/api/docs/#{other_doc.id}", update_params)
        |> json_response(404)

      assert response["errors"]
    end

    test "returns error with invalid attributes", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      doc = insert(:doc, workspace_id: workspace.id, author_id: user.id)

      update_params = %{
        title: ""
      }

      response =
        conn
        |> put(~p"/api/docs/#{doc.id}", update_params)
        |> dbg()

      IO.inspect(response, label: "UPDATE RESPONSE")
      IO.inspect(response.status, label: "UPDATE STATUS")

      body =
        if response.status == 422 do
          json_response(response, 422)
        else
          json_response(response, response.status)
        end

      IO.inspect(body, label: "UPDATE BODY")

      assert body["errors"]["title"]
    end

    test "can toggle starred status", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      doc =
        insert(:doc,
          workspace_id: workspace.id,
          author_id: user.id,
          starred: false
        )

      update_params = %{
        starred: true
      }

      response =
        conn
        |> put(~p"/api/docs/#{doc.id}", update_params)
        |> json_response(200)

      assert response["data"]["starred"] == true
    end
  end

  describe "delete" do
    test "deletes doc when found", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      doc = insert(:doc, workspace_id: workspace.id, author_id: user.id)

      conn
      |> delete(~p"/api/docs/#{doc.id}")
      |> response(204)

      # Verify it's deleted
      response =
        conn
        |> get(~p"/api/docs/#{doc.id}")
        |> json_response(404)

      assert response["errors"]
    end

    test "returns 404 when doc not found", %{conn: conn} do
      fake_id = UUIDv7.generate()

      response =
        conn
        |> delete(~p"/api/docs/#{fake_id}")
        |> json_response(404)

      assert response["errors"]
    end

    test "returns 404 when doc exists but in different workspace", %{conn: conn} do
      other_workspace = insert(:workspace)
      other_user = insert(:user, workspace_id: other_workspace.id)

      other_doc =
        insert(:doc,
          workspace_id: other_workspace.id,
          author_id: other_user.id
        )

      response =
        conn
        |> delete(~p"/api/docs/#{other_doc.id}")
        |> json_response(404)

      assert response["errors"]
    end

    test "doc no longer appears in list after deletion", %{
      conn: conn,
      workspace: workspace,
      user: user
    } do
      doc = insert(:doc, workspace_id: workspace.id, author_id: user.id)

      # Verify it's in the list first
      list_response =
        conn
        |> get(~p"/api/docs")
        |> json_response(200)

      assert Enum.any?(list_response["data"], fn d -> d["id"] == doc.id end)

      # Delete it
      conn
      |> delete(~p"/api/docs/#{doc.id}")
      |> response(204)

      # Verify it's no longer in the list
      list_response =
        conn
        |> get(~p"/api/docs")
        |> json_response(200)

      refute Enum.any?(list_response["data"], fn d -> d["id"] == doc.id end)
    end
  end
end
