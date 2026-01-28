defmodule BridgeWeb.DocController do
  use BridgeWeb, :controller

  alias Bridge.Docs
  alias Bridge.Docs.Doc

  action_fallback(BridgeWeb.FallbackController)

  def index(conn, _params) do
    docs = Docs.list_docs()
    render(conn, :index, docs: docs)
  end

  def create(conn, %{"doc" => doc_params}) do
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

  def update(conn, %{"id" => id, "doc" => doc_params}) do
    doc = Docs.get_doc!(id)

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
