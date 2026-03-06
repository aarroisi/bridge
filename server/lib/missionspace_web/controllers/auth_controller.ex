defmodule MissionspaceWeb.AuthController do
  use MissionspaceWeb, :controller

  alias Missionspace.Accounts

  action_fallback(MissionspaceWeb.FallbackController)

  @max_remembered_accounts 10

  def register(conn, %{
        "workspace_name" => workspace_name,
        "name" => name,
        "email" => email,
        "password" => password
      }) do
    case Accounts.register_workspace_and_user(workspace_name, name, email, password) do
      {:ok, %{workspace: workspace, user: user}} ->
        conn
        |> put_session(:user_id, user.id)
        |> put_session(:workspace_id, workspace.id)
        |> remember_account(user.id)
        |> put_status(:created)
        |> json(auth_payload(user, workspace))

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def login(conn, %{"email" => email, "password" => password}) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        if is_nil(user.email_verified_at) do
          conn
          |> put_session(:user_id, user.id)
          |> put_session(:workspace_id, user.workspace_id)
          |> put_status(:forbidden)
          |> json(%{error: "email_not_verified"})
        else
          conn
          |> put_session(:user_id, user.id)
          |> put_session(:workspace_id, user.workspace_id)
          |> remember_account(user.id)
          |> json(auth_payload(user, user.workspace))
        end

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})
    end
  end

  def logout(conn, _params) do
    current_user_id = get_session(conn, :user_id)

    remaining_account_ids =
      conn
      |> account_user_ids()
      |> Enum.reject(&(&1 == current_user_id))

    conn
    |> delete_session(:user_id)
    |> delete_session(:workspace_id)
    |> persist_account_user_ids(remaining_account_ids)
    |> json(%{message: "Logged out successfully"})
  end

  def accounts(conn, _params) do
    current_user_id = get_session(conn, :user_id)

    account_summaries =
      conn
      |> account_user_ids()
      |> Enum.map(&account_summary(&1, current_user_id))
      |> Enum.reject(&is_nil/1)

    conn
    |> persist_account_user_ids(Enum.map(account_summaries, & &1.user.id))
    |> json(%{data: account_summaries})
  end

  def switch_account(conn, %{"user_id" => user_id}) do
    remembered_user_ids = account_user_ids(conn)

    if user_id in remembered_user_ids do
      case load_account_user(user_id) do
        {:ok, user} ->
          conn
          |> put_session(:user_id, user.id)
          |> put_session(:workspace_id, user.workspace_id)
          |> remember_account(user.id)
          |> json(auth_payload(user, user.workspace))

        {:error, :not_available} ->
          conn
          |> persist_account_user_ids(Enum.reject(remembered_user_ids, &(&1 == user_id)))
          |> put_status(:forbidden)
          |> json(%{error: "account_not_available"})
      end
    else
      conn
      |> put_status(:forbidden)
      |> json(%{error: "account_not_available"})
    end
  end

  def add_account(conn, %{"email" => email, "password" => password}) do
    current_user_id = get_session(conn, :user_id)

    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        if is_nil(user.email_verified_at) do
          conn
          |> put_status(:forbidden)
          |> json(%{error: "email_not_verified"})
        else
          user = Missionspace.Repo.preload(user, :workspace)

          conn
          |> remember_account(user.id)
          |> json(%{data: account_summary_map(user, current_user_id)})
        end

      {:error, :invalid_credentials} ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})
    end
  end

  def me(conn, _params) do
    case get_session(conn, :user_id) do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Not authenticated"})

      user_id ->
        case Accounts.get_user(user_id) do
          {:ok, user} ->
            user = Missionspace.Repo.preload(user, :workspace)

            if is_nil(user.email_verified_at) do
              conn
              |> put_status(:forbidden)
              |> json(%{error: "email_not_verified"})
            else
              conn
              |> remember_account(user.id)
              |> json(auth_payload(user, user.workspace))
            end

          {:error, :not_found} ->
            conn
            |> put_status(:unauthorized)
            |> json(%{error: "User not found"})
        end
    end
  end

  def update_me(conn, %{"user" => user_params}) do
    current_user = conn.assigns.current_user

    # Only allow updating name, email, avatar, and timezone
    allowed_params = Map.take(user_params, ["name", "email", "avatar", "timezone"])

    case Accounts.update_user(current_user, allowed_params) do
      {:ok, user} ->
        user = Missionspace.Repo.preload(user, :workspace)

        json(conn, auth_payload(user, user.workspace))

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def verify_email(conn, %{"token" => token}) do
    case Accounts.verify_email(token) do
      {:ok, _user} ->
        json(conn, %{message: "Email verified successfully"})

      {:error, :invalid_token} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid or expired verification token"})
    end
  end

  def forgot_password(conn, %{"email" => email}) do
    Accounts.request_password_reset(email)
    # Always return success to prevent email enumeration
    json(conn, %{message: "If an account exists with that email, we sent a password reset link"})
  end

  def reset_password(conn, %{"token" => token, "password" => password}) do
    case Accounts.reset_password(token, password) do
      {:ok, _user} ->
        json(conn, %{message: "Password reset successfully"})

      {:error, :invalid_token} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid reset token"})

      {:error, :token_expired} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Reset token has expired"})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: translate_errors(changeset)})
    end
  end

  def resend_verification(conn, _params) do
    current_user = conn.assigns.current_user

    if current_user.email_verified_at do
      json(conn, %{message: "Email already verified"})
    else
      case Accounts.resend_verification_email(current_user) do
        {:ok, _user} ->
          json(conn, %{message: "Verification email sent"})

        {:error, _} ->
          conn
          |> put_status(:internal_server_error)
          |> json(%{error: "Failed to send verification email"})
      end
    end
  end

  defp translate_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Regex.replace(~r"%{(\w+)}", msg, fn _, key ->
        opts |> Keyword.get(String.to_existing_atom(key), key) |> to_string()
      end)
    end)
  end

  defp auth_payload(user, workspace) do
    %{
      user: user_payload(user),
      workspace: workspace_payload(workspace)
    }
  end

  defp user_payload(user) do
    %{
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      timezone: user.timezone,
      role: user.role,
      workspace_id: user.workspace_id
    }
  end

  defp workspace_payload(workspace) do
    %{
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logo: workspace.logo
    }
  end

  defp account_summary(user_id, current_user_id) do
    case load_account_user(user_id) do
      {:ok, user} -> account_summary_map(user, current_user_id)
      {:error, :not_available} -> nil
    end
  end

  defp account_summary_map(user, current_user_id) do
    %{
      user: user_payload(user),
      workspace: workspace_payload(user.workspace),
      current: user.id == current_user_id
    }
  end

  defp load_account_user(user_id) do
    case Accounts.get_user(user_id) do
      {:ok, user} ->
        user = Missionspace.Repo.preload(user, :workspace)

        cond do
          not user.is_active -> {:error, :not_available}
          is_nil(user.email_verified_at) -> {:error, :not_available}
          is_nil(user.workspace) -> {:error, :not_available}
          true -> {:ok, user}
        end

      {:error, :not_found} ->
        {:error, :not_available}
    end
  end

  defp remember_account(conn, user_id) do
    updated_ids =
      conn
      |> account_user_ids()
      |> Enum.reject(&(&1 == user_id))
      |> then(&[user_id | &1])
      |> Enum.take(@max_remembered_accounts)

    persist_account_user_ids(conn, updated_ids)
  end

  defp account_user_ids(conn) do
    conn
    |> get_session(:account_user_ids)
    |> normalize_account_user_ids()
  end

  defp normalize_account_user_ids(account_ids) when is_list(account_ids) do
    account_ids
    |> Enum.filter(&is_binary/1)
    |> Enum.uniq()
    |> Enum.take(@max_remembered_accounts)
  end

  defp normalize_account_user_ids(_), do: []

  defp persist_account_user_ids(conn, account_ids) when is_list(account_ids) do
    case normalize_account_user_ids(account_ids) do
      [] -> delete_session(conn, :account_user_ids)
      normalized_ids -> put_session(conn, :account_user_ids, normalized_ids)
    end
  end
end
