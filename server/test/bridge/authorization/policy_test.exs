defmodule Bridge.Authorization.PolicyTest do
  use Bridge.DataCase

  alias Bridge.Authorization.Policy

  describe "can?/3 for owners" do
    setup do
      workspace = insert(:workspace)
      owner = insert(:user, workspace_id: workspace.id, role: "owner")
      project = insert(:project, workspace_id: workspace.id)
      doc = insert(:doc, workspace_id: workspace.id, author_id: owner.id)
      # Link doc to project via project_items
      insert(:project_item, project_id: project.id, item_type: "doc", item_id: doc.id)

      {:ok, owner: owner, workspace: workspace, project: project, doc: doc}
    end

    test "owner can do anything", %{owner: owner, project: project, doc: doc} do
      assert Policy.can?(owner, :view_project, project)
      assert Policy.can?(owner, :view_item, doc)
      assert Policy.can?(owner, :update_item, doc)
      assert Policy.can?(owner, :delete_item, doc)
      assert Policy.can?(owner, :manage_workspace_members, nil)
      assert Policy.can?(owner, :manage_project_members, project)
    end

    test "owner can view workspace-level items (items not in any project)", %{
      owner: owner,
      workspace: workspace
    } do
      # Doc without project association
      workspace_doc =
        insert(:doc, workspace_id: workspace.id, author_id: owner.id)

      # Owner can still view it (owner can do anything)
      assert Policy.can?(owner, :view_item, workspace_doc)
    end
  end

  describe "can?/3 for members" do
    setup do
      workspace = insert(:workspace)
      member = insert(:user, workspace_id: workspace.id, role: "member")
      project = insert(:project, workspace_id: workspace.id)
      insert(:project_member, user_id: member.id, project_id: project.id)

      other_user = insert(:user, workspace_id: workspace.id, role: "member")

      member_doc =
        insert(:doc, workspace_id: workspace.id, author_id: member.id)

      # Link member_doc to project
      insert(:project_item, project_id: project.id, item_type: "doc", item_id: member_doc.id)

      other_doc =
        insert(:doc, workspace_id: workspace.id, author_id: other_user.id)

      # Link other_doc to project
      insert(:project_item, project_id: project.id, item_type: "doc", item_id: other_doc.id)

      {:ok,
       member: member,
       workspace: workspace,
       project: project,
       member_doc: member_doc,
       other_doc: other_doc}
    end

    test "member can view projects they are assigned to", %{member: member, project: project} do
      assert Policy.can?(member, :view_project, project)
    end

    test "member cannot view projects they are not assigned to", %{
      member: member,
      workspace: workspace
    } do
      other_project = insert(:project, workspace_id: workspace.id)
      refute Policy.can?(member, :view_project, other_project)
    end

    test "member can view items in assigned projects", %{member: member, member_doc: doc} do
      assert Policy.can?(member, :view_item, doc)
    end

    test "member cannot view workspace-level items (not in any project)", %{
      member: member,
      workspace: workspace
    } do
      # Doc without project association
      workspace_doc =
        insert(:doc, workspace_id: workspace.id, author_id: member.id)

      refute Policy.can?(member, :view_item, workspace_doc)
    end

    test "member can update their own items", %{member: member, member_doc: doc} do
      assert Policy.can?(member, :update_item, doc)
    end

    test "member cannot update others' items", %{member: member, other_doc: doc} do
      refute Policy.can?(member, :update_item, doc)
    end

    test "member can delete their own items", %{member: member, member_doc: doc} do
      assert Policy.can?(member, :delete_item, doc)
    end

    test "member cannot delete others' items", %{member: member, other_doc: doc} do
      refute Policy.can?(member, :delete_item, doc)
    end

    test "member cannot manage workspace members", %{member: member} do
      refute Policy.can?(member, :manage_workspace_members, nil)
    end

    test "member cannot manage project members", %{member: member, project: project} do
      refute Policy.can?(member, :manage_project_members, project)
    end

    test "member can comment on viewable items", %{member: member, member_doc: doc} do
      assert Policy.can?(member, :comment, doc)
    end
  end

  describe "can?/3 for guests" do
    setup do
      workspace = insert(:workspace)
      guest = insert(:user, workspace_id: workspace.id, role: "guest")
      project = insert(:project, workspace_id: workspace.id)
      insert(:project_member, user_id: guest.id, project_id: project.id)

      other_user = insert(:user, workspace_id: workspace.id, role: "owner")

      guest_doc =
        insert(:doc, workspace_id: workspace.id, author_id: guest.id)

      # Link guest_doc to project
      insert(:project_item, project_id: project.id, item_type: "doc", item_id: guest_doc.id)

      other_doc =
        insert(:doc, workspace_id: workspace.id, author_id: other_user.id)

      # Link other_doc to project
      insert(:project_item, project_id: project.id, item_type: "doc", item_id: other_doc.id)

      {:ok,
       guest: guest,
       workspace: workspace,
       project: project,
       guest_doc: guest_doc,
       other_doc: other_doc}
    end

    test "guest can view assigned project", %{guest: guest, project: project} do
      assert Policy.can?(guest, :view_project, project)
    end

    test "guest cannot view other projects", %{guest: guest, workspace: workspace} do
      other_project = insert(:project, workspace_id: workspace.id)
      refute Policy.can?(guest, :view_project, other_project)
    end

    test "guest can view items in assigned project", %{guest: guest, guest_doc: doc} do
      assert Policy.can?(guest, :view_item, doc)
    end

    test "guest can update their own items", %{guest: guest, guest_doc: doc} do
      assert Policy.can?(guest, :update_item, doc)
    end

    test "guest cannot update others' items", %{guest: guest, other_doc: doc} do
      refute Policy.can?(guest, :update_item, doc)
    end

    test "guest cannot manage workspace members", %{guest: guest} do
      refute Policy.can?(guest, :manage_workspace_members, nil)
    end

    test "guest cannot manage project members", %{guest: guest, project: project} do
      refute Policy.can?(guest, :manage_project_members, project)
    end
  end

  describe "can?/3 for create_item" do
    setup do
      workspace = insert(:workspace)
      member = insert(:user, workspace_id: workspace.id, role: "member")
      project = insert(:project, workspace_id: workspace.id)
      insert(:project_member, user_id: member.id, project_id: project.id)

      {:ok, member: member, workspace: workspace, project: project}
    end

    test "member can create items in assigned projects", %{member: member, project: project} do
      assert Policy.can?(member, :create_item, project.id)
    end

    test "member cannot create items in unassigned projects", %{
      member: member,
      workspace: workspace
    } do
      other_project = insert(:project, workspace_id: workspace.id)
      refute Policy.can?(member, :create_item, other_project.id)
    end

    test "member cannot create workspace-level items", %{member: member} do
      refute Policy.can?(member, :create_item, nil)
    end
  end
end
