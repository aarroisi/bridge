defmodule BridgeWeb.DocController do
  use BridgeWeb, :controller

  alias Bridge.Docs
  alias Bridge.Docs.Doc

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    docs = Docs.list_docs()
    render(conn, :index, docs: docs)
  end

  def create(conn, params) do
    current_user = conn.assigns.current_user

    # Handle both nested and flat params
    doc_params =
      case params do
        %{"doc" => nested_params} -> nested_params
        flat_params -> flat_params
      end

    # Add author_id
    doc_params = Map.put(doc_params, "author_id", current_user.id)

    case Docs.create_doc(doc_params) do
      {:ok, doc} ->
        conn
        |> put_status(:created)
        |> render(:show, doc: doc)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    doc = Docs.get_doc!(id)
    render(conn, :show, doc: doc)
  end

  def update(conn, params) do
    id = params["id"]
    doc = Docs.get_doc!(id)

    # Handle both nested and flat params
    doc_params =
      case params do
        %{"doc" => nested_params} -> nested_params
        flat_params -> Map.drop(flat_params, ["id"])
      end

    case Docs.update_doc(doc, doc_params) do
      {:ok, doc} ->
        render(conn, :show, doc: doc)

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    doc = Docs.get_doc!(id)

    case Docs.delete_doc(doc) do
      {:ok, _doc} ->
        send_resp(conn, :no_content, "")

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:error, changeset: changeset)
    end
  end
end
