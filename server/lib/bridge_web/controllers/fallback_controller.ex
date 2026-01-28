defmodule BridgeWeb.FallbackController do
  @moduledoc """
  Translates controller action results into valid `Plug.Conn` responses.

  See `Phoenix.Controller.action_fallback/1` for more details.
  """
  use BridgeWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: BridgeWeb.ErrorJSON)
    |> render(:error, changeset: changeset)
  end

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: BridgeWeb.ErrorJSON)
    |> render(:"404")
  end

  # Handle Ecto.NoResultsError (raised by get! functions)
  def call(conn, {:error, %Ecto.NoResultsError{}}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: BridgeWeb.ErrorJSON)
    |> render(:"404")
  end
end
