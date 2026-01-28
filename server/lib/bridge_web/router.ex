defmodule BridgeWeb.Router do
  use BridgeWeb, :router

  pipeline :api do
    plug(:accepts, ["json"])
    plug(:fetch_session)
  end

  pipeline :authenticated do
    plug(BridgeWeb.Plugs.AuthPlug)
  end

  scope "/api", BridgeWeb do
    pipe_through(:api)

    # Auth routes (no authentication required)
    post("/auth/register", AuthController, :register)
    post("/auth/login", AuthController, :login)
    post("/auth/logout", AuthController, :logout)
    get("/auth/me", AuthController, :me)
  end

  scope "/api", BridgeWeb do
    pipe_through([:api, :authenticated])

    # Resource routes (authentication required)
    resources("/projects", ProjectController, except: [:new, :edit])
    resources("/lists", ListController, except: [:new, :edit])
    resources("/tasks", TaskController, except: [:new, :edit])
    resources("/subtasks", SubtaskController, except: [:new, :edit])
    resources("/docs", DocController, except: [:new, :edit])
    resources("/channels", ChannelController, except: [:new, :edit])
    resources("/direct_messages", DirectMessageController, except: [:new, :edit])
    resources("/messages", MessageController, except: [:new, :edit])
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:bridge, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through([:fetch_session, :protect_from_forgery])

      live_dashboard("/dashboard", metrics: BridgeWeb.Telemetry)
      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end
end
