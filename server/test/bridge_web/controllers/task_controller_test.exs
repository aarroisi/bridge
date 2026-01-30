defmodule BridgeWeb.TaskControllerTest do
  use BridgeWeb.ConnCase

  setup do
    workspace = insert(:workspace)
    user = insert(:user, workspace_id: workspace.id)
    project = insert(:project, workspace_id: workspace.id)
    list = insert(:list, workspace_id: workspace.id)

    conn =
      build_conn()
      |> Plug.Test.init_test_session(%{})
      |> put_session(:user_id, user.id)
      |> put_req_header("accept", "application/json")

    {:ok, conn: conn, workspace: workspace, user: user, project: project, list: list}
  end

  describe "index" do
    test "returns all tasks in list", %{conn: conn, user: user, list: list} do
      task1 = insert(:task, list_id: list.id, created_by_id: user.id)
      task2 = insert(:task, list_id: list.id, created_by_id: user.id)

      response =
        conn
        |> get(~p"/api/tasks?list_id=#{list.id}")
        |> json_response(200)

      task_ids = Enum.map(response["data"], & &1["id"])
      assert task1.id in task_ids
      assert task2.id in task_ids
    end

    test "does not return tasks from other lists", %{
      conn: conn,
      user: user,
      workspace: workspace,
      list: list
    } do
      other_list = insert(:list, workspace_id: workspace.id)
      _task_in_list = insert(:task, list_id: list.id, created_by_id: user.id)
      other_task = insert(:task, list_id: other_list.id, created_by_id: user.id)

      response =
        conn
        |> get(~p"/api/tasks?list_id=#{list.id}")
        |> json_response(200)

      task_ids = Enum.map(response["data"], & &1["id"])
      refute other_task.id in task_ids
    end

    test "returns empty list when no tasks exist", %{conn: conn, list: list} do
      response =
        conn
        |> get(~p"/api/tasks?list_id=#{list.id}")
        |> json_response(200)

      assert response["data"] == []
    end

    test "returns empty list when no list_id provided", %{conn: conn} do
      response =
        conn
        |> get(~p"/api/tasks")
        |> json_response(200)

      assert response["data"] == []
    end

    test "returns paginated results with correct metadata", %{conn: conn, user: user, list: list} do
      # Create 5 tasks
      for _ <- 1..5 do
        insert(:task, list_id: list.id, created_by_id: user.id)
      end

      response =
        conn
        |> get(~p"/api/tasks?list_id=#{list.id}&limit=2")
        |> json_response(200)

      assert length(response["data"]) == 2
      assert response["metadata"]["limit"] == 2
      assert is_binary(response["metadata"]["after"]) or is_nil(response["metadata"]["after"])
      assert is_nil(response["metadata"]["before"])
    end
  end

  describe "create" do
    test "creates task with valid attributes", %{conn: conn, user: user, list: list} do
      task_params = %{
        title: "New Task",
        status: "todo",
        notes: "Some notes",
        list_id: list.id
      }

      response =
        conn
        |> post(~p"/api/tasks", task: task_params)
        |> json_response(201)

      assert response["data"]["title"] == "New Task"
      assert response["data"]["status"] == "todo"
      assert response["data"]["notes"] == "Some notes"
      assert response["data"]["list_id"] == list.id
      assert response["data"]["created_by_id"] == user.id
      assert response["data"]["id"]
    end

    test "creates task with minimal required attributes", %{conn: conn, list: list} do
      task_params = %{
        title: "Simple Task",
        list_id: list.id
      }

      response =
        conn
        |> post(~p"/api/tasks", task: task_params)
        |> json_response(201)

      assert response["data"]["title"] == "Simple Task"
      assert response["data"]["status"] == "todo"
      assert response["data"]["id"]
    end

    test "created task appears in index", %{conn: conn, list: list} do
      task_params = %{
        title: "Test Task",
        list_id: list.id
      }

      create_response =
        conn
        |> post(~p"/api/tasks", task: task_params)
        |> json_response(201)

      task_id = create_response["data"]["id"]

      index_response =
        conn
        |> get(~p"/api/tasks?list_id=#{list.id}")
        |> json_response(200)

      task_ids = Enum.map(index_response["data"], & &1["id"])
      assert task_id in task_ids
    end

    test "returns error with invalid attributes", %{conn: conn} do
      task_params = %{
        title: ""
      }

      response =
        conn
        |> post(~p"/api/tasks", task: task_params)
        |> json_response(422)

      assert response["errors"]["title"] || response["errors"]["list_id"]
    end

    test "returns error with invalid status", %{conn: conn, list: list} do
      task_params = %{
        title: "Task",
        status: "invalid_status",
        list_id: list.id
      }

      response =
        conn
        |> post(~p"/api/tasks", task: task_params)
        |> json_response(422)

      assert response["errors"]["status"]
    end

    test "sets created_by_id to current user", %{conn: conn, user: user, list: list} do
      task_params = %{
        title: "Test Task",
        list_id: list.id
      }

      response =
        conn
        |> post(~p"/api/tasks", task: task_params)
        |> json_response(201)

      assert response["data"]["created_by_id"] == user.id
    end
  end

  describe "show" do
    test "returns task by id", %{conn: conn, user: user, list: list} do
      task =
        insert(:task,
          list_id: list.id,
          created_by_id: user.id,
          title: "Test Task",
          status: "doing"
        )

      response =
        conn
        |> get(~p"/api/tasks/#{task.id}")
        |> json_response(200)

      assert response["data"]["id"] == task.id
      assert response["data"]["title"] == "Test Task"
      assert response["data"]["status"] == "doing"
      assert response["data"]["list_id"] == list.id
    end

    test "returns 404 for non-existent task", %{conn: conn} do
      conn
      |> get(~p"/api/tasks/00000000-0000-0000-0000-000000000000")
      |> json_response(404)
    end
  end

  describe "update" do
    test "updates task with valid attributes", %{conn: conn, user: user, list: list} do
      task =
        insert(:task,
          list_id: list.id,
          created_by_id: user.id,
          title: "Old Title",
          status: "todo"
        )

      update_params = %{
        title: "New Title",
        status: "done"
      }

      response =
        conn
        |> put(~p"/api/tasks/#{task.id}", task: update_params)
        |> json_response(200)

      assert response["data"]["title"] == "New Title"
      assert response["data"]["status"] == "done"
    end

    test "updates task notes", %{conn: conn, user: user, list: list} do
      task = insert(:task, list_id: list.id, created_by_id: user.id)

      update_params = %{
        notes: "Updated notes"
      }

      response =
        conn
        |> put(~p"/api/tasks/#{task.id}", task: update_params)
        |> json_response(200)

      assert response["data"]["notes"] == "Updated notes"
    end

    test "updated task reflects changes in show", %{conn: conn, user: user, list: list} do
      task = insert(:task, list_id: list.id, created_by_id: user.id, title: "Old Title")

      update_params = %{title: "Updated Title"}

      conn
      |> put(~p"/api/tasks/#{task.id}", task: update_params)
      |> json_response(200)

      show_response =
        conn
        |> get(~p"/api/tasks/#{task.id}")
        |> json_response(200)

      assert show_response["data"]["title"] == "Updated Title"
    end

    test "returns error with invalid attributes", %{conn: conn, user: user, list: list} do
      task = insert(:task, list_id: list.id, created_by_id: user.id)

      update_params = %{
        title: ""
      }

      response =
        conn
        |> put(~p"/api/tasks/#{task.id}", task: update_params)
        |> json_response(422)

      assert response["errors"]["title"]
    end

    test "returns error with invalid status", %{conn: conn, user: user, list: list} do
      task = insert(:task, list_id: list.id, created_by_id: user.id)

      update_params = %{
        status: "invalid_status"
      }

      response =
        conn
        |> put(~p"/api/tasks/#{task.id}", task: update_params)
        |> json_response(422)

      assert response["errors"]["status"]
    end

    test "returns 404 for non-existent task", %{conn: conn} do
      update_params = %{title: "New Title"}

      conn
      |> put(~p"/api/tasks/00000000-0000-0000-0000-000000000000", task: update_params)
      |> json_response(404)
    end
  end

  describe "delete" do
    test "deletes task", %{conn: conn, user: user, list: list} do
      task = insert(:task, list_id: list.id, created_by_id: user.id)

      conn
      |> delete(~p"/api/tasks/#{task.id}")
      |> response(204)
    end

    test "deleted task no longer appears in index", %{conn: conn, user: user, list: list} do
      task = insert(:task, list_id: list.id, created_by_id: user.id)

      conn
      |> delete(~p"/api/tasks/#{task.id}")
      |> response(204)

      index_response =
        conn
        |> get(~p"/api/tasks?list_id=#{list.id}")
        |> json_response(200)

      task_ids = Enum.map(index_response["data"], & &1["id"])
      refute task.id in task_ids
    end

    test "deleted task returns 404 on show", %{conn: conn, user: user, list: list} do
      task = insert(:task, list_id: list.id, created_by_id: user.id)

      conn
      |> delete(~p"/api/tasks/#{task.id}")
      |> response(204)

      conn
      |> get(~p"/api/tasks/#{task.id}")
      |> json_response(404)
    end

    test "returns 404 for non-existent task", %{conn: conn} do
      conn
      |> delete(~p"/api/tasks/00000000-0000-0000-0000-000000000000")
      |> json_response(404)
    end
  end
end
