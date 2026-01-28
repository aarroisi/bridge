defmodule BridgeWeb.DocController do
  use BridgeWeb, :controller

  alias Bridge.Docs
  import BridgeWeb.PaginationHelpers

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, params) do
    workspace_id = conn.assigns.workspace_id

    opts = build_pagination_opts(params)
    page = Docs.list_docs(workspace_id, opts)

    render(conn, :index, page: page)
  end

  def create(conn, params) do
    current_user = conn.assigns.current_user
    workspace_id = conn.assigns.workspace_id

    # Handle both nested and flat params
    doc_params =
      case params do
        %{"doc" => nested_params} -> nested_params
        flat_params -> flat_params
      end

    # Add author_id and workspace_id
    doc_params =
      doc_params
      |> Map.put("author_id", current_user.id)
      |> Map.put("workspace_id", workspace_id)

    with {:ok, doc} <- Docs.create_doc(doc_params) do
      conn
      |> put_status(:created)
      |> render(:show, doc: doc)
    end
  end

  def show(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, doc} <- Docs.get_doc(id, workspace_id) do
      render(conn, :show, doc: doc)
    end
  end

  def update(conn, params) do
    workspace_id = conn.assigns.workspace_id
    id = params["id"]

    # Handle both nested and flat params
    doc_params =
      case params do
        %{"doc" => nested_params} -> nested_params
        flat_params -> Map.drop(flat_params, ["id"])
      end

    with {:ok, doc} <- Docs.get_doc(id, workspace_id),
         {:ok, doc} <- Docs.update_doc(doc, doc_params) do
      render(conn, :show, doc: doc)
    end
  end

  def delete(conn, %{"id" => id}) do
    workspace_id = conn.assigns.workspace_id

    with {:ok, doc} <- Docs.get_doc(id, workspace_id),
         {:ok, _doc} <- Docs.delete_doc(doc) do
      send_resp(conn, :no_content, "")
    end
  end
end
