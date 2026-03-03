defmodule BridgeWeb.HealthController do
  use BridgeWeb, :controller

  def index(conn, _params) do
    json(conn, %{status: "ok"})
  end
end
