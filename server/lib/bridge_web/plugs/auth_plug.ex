defmodule BridgeWeb.Plugs.AuthPlug do
  import Plug.Conn
  import Phoenix.Controller

  alias Bridge.Accounts

  def init(opts), do: opts

  def call(conn, _opts) do
    user_id = get_session(conn, :user_id)

    if user_id do
      user = Accounts.get_user!(user_id)
      assign(conn, :current_user, user)
    else
      conn
      |> put_status(:unauthorized)
      |> put_view(json: BridgeWeb.ErrorJSON)
      |> render(:"401")
      |> halt()
    end
  end
end
