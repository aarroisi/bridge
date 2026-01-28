defmodule Bridge.Authorization.Policy do
  @moduledoc """
  Authorization policy module that determines if a user can perform an action on a resource.

  Roles:
  - owner: Full access to everything in workspace
  - member: Access to assigned projects only, can update only own items
  - guest: Same as member but limited to one project
  """

  alias Bridge.Accounts.User
  alias Bridge.Projects

  @doc """
  Check if a user can perform an action on a resource.
  Returns true if allowed, false otherwise.
  """
  def can?(user, action, resource \\ nil)

  # Owner can do anything
  def can?(%User{role: "owner"}, _action, _resource), do: true

  # Workspace member management - owner only (already handled above)
  def can?(_user, :manage_workspace_members, _resource), do: false

  # Project member management - owner only
  def can?(_user, :manage_project_members, _resource), do: false

  # Project management (create/update/delete projects) - owner only
  def can?(_user, :manage_projects, _resource), do: false

  # View project - must be member of project
  def can?(user, :view_project, project) do
    is_project_member?(user, project.id)
  end

  # View item - must have access to item's project
  def can?(_user, :view_item, %{project_id: nil, list: nil}), do: false

  def can?(user, :view_item, item) do
    is_project_member?(user, get_project_id(item))
  end

  # Create item in project - must be member of that project
  def can?(_user, :create_item, nil), do: false

  def can?(user, :create_item, project_id) do
    is_project_member?(user, project_id)
  end

  # Update item - must be creator
  def can?(user, :update_item, item) do
    is_creator?(user, item) and is_project_member?(user, get_project_id(item))
  end

  # Delete item - must be creator
  def can?(user, :delete_item, item) do
    is_creator?(user, item) and is_project_member?(user, get_project_id(item))
  end

  # Comment - can view = can comment
  # DMs are accessible to all workspace members
  def can?(_user, :comment, %{project_id: :dm}), do: true

  def can?(user, :comment, item) do
    can?(user, :view_item, item)
  end

  # Default deny
  def can?(_user, _action, _resource), do: false

  # Helper: Check if user is a member of the project
  defp is_project_member?(%User{id: user_id}, project_id) when not is_nil(project_id) do
    Projects.is_member?(project_id, user_id)
  end

  defp is_project_member?(_user, _project_id), do: false

  # Helper: Check if user is the creator of the item
  defp is_creator?(%User{id: user_id}, item) do
    get_creator_id(item) == user_id
  end

  defp get_creator_id(%{author_id: author_id}), do: author_id
  defp get_creator_id(%{created_by_id: created_by_id}), do: created_by_id
  defp get_creator_id(_), do: nil

  # Helper: Get project_id from item (handles nested items like tasks under lists)
  defp get_project_id(%{project_id: project_id}) when not is_nil(project_id), do: project_id

  defp get_project_id(%{list: %{project_id: project_id}}) when not is_nil(project_id),
    do: project_id

  defp get_project_id(%{task: %{list: %{project_id: project_id}}}) when not is_nil(project_id),
    do: project_id

  defp get_project_id(_), do: nil
end
