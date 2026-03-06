defmodule MissionspaceWeb.ChannelCase do
  @moduledoc """
  This module defines the test case to be used by
  channel tests.

  Such tests rely on `Phoenix.ChannelTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.
  """

  use ExUnit.CaseTemplate

  using do
    quote do
      @endpoint MissionspaceWeb.Endpoint

      use MissionspaceWeb, :verified_routes

      import Phoenix.ChannelTest
      import MissionspaceWeb.ChannelCase
      import Missionspace.Factory
    end
  end

  setup tags do
    Missionspace.DataCase.setup_sandbox(tags)
    :ok
  end
end
