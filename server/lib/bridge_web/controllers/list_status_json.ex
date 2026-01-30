defmodule BridgeWeb.ListStatusJSON do
  alias Bridge.Lists.ListStatus

  def index(%{statuses: statuses}) do
    %{data: for(status <- statuses, do: data(status))}
  end

  def show(%{status: status}) do
    %{data: data(status)}
  end

  defp data(%ListStatus{} = status) do
    %{
      id: status.id,
      name: status.name,
      color: status.color,
      position: status.position,
      list_id: status.list_id,
      inserted_at: status.inserted_at,
      updated_at: status.updated_at
    }
  end
end
