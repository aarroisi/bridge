defmodule Missionspace.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @sentry_logger_handler :missionspace_sentry_handler

  @impl true
  def start(_type, _args) do
    maybe_attach_sentry_logger_handler()

    children =
      [
        MissionspaceWeb.Telemetry,
        Missionspace.Repo,
        {DNSCluster, query: Application.get_env(:missionspace, :dns_cluster_query) || :ignore},
        {Phoenix.PubSub, name: Missionspace.PubSub},
        Missionspace.Jido,
        {Oban, Application.fetch_env!(:missionspace, Oban)},
        # Start presence tracking
        MissionspaceWeb.Presence,
        # Start a worker by calling: Missionspace.Worker.start_link(arg)
        # {Missionspace.Worker, arg},
        # Start to serve requests, typically the last entry
        MissionspaceWeb.Endpoint
      ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Missionspace.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp maybe_attach_sentry_logger_handler do
    if Application.get_env(:sentry, :dsn) do
      case :logger.add_handler(@sentry_logger_handler, Sentry.LoggerHandler, %{
             config: %{metadata: [:file, :line]}
           }) do
        :ok -> :ok
        {:error, {:already_exist, @sentry_logger_handler}} -> :ok
      end
    end
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    MissionspaceWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
