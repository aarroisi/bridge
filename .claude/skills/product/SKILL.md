---
name: product
description: Product specification and business rules for Bridge. Reference this when implementing features that involve business logic, data ownership, user management, or permissions.
user-invocable: false
---

# Bridge Product Specification

## Overview

Bridge is a team collaboration platform for workspaces. Each workspace is an isolated environment containing projects, boards, docs, channels, and members.

---

## Data Ownership Model

### Principle: Workspace Owns All Content

All content created within a workspace belongs to the workspace, not individual users. This includes:

- Projects
- Boards (lists) and tasks
- Documents
- Channels and messages
- Comments on any entity

**Rationale**: In a business context, work product created by employees belongs to the organization. When team members leave, their contributions must remain accessible to the team.

---

## User Management

### Roles

| Role       | Description                   | Permissions                      |
| ---------- | ----------------------------- | -------------------------------- |
| **Owner**  | Workspace administrator       | Full access to everything        |
| **Member** | Regular team member           | Access to assigned projects only |
| **Guest**  | Limited external collaborator | Access to one project only       |

### Member Deletion (Soft Delete)

When a workspace member is removed:

1. **User record is preserved** - Never hard-delete user records
   - Set `is_active = false`
   - Set `deleted_at` timestamp
   - Scrub email to `deleted_{uuid}@deleted.local` (frees email for reuse)

2. **Content is preserved** - All user-created content remains:
   - Messages and comments
   - Tasks and subtasks (created_by reference intact)
   - Documents (author reference intact)
   - Projects, boards, channels (created_by reference intact)

3. **Associations are cleaned up**:
   - Project memberships are removed
   - Notifications are deleted (personal to user)
   - Task/subtask assignments remain (can be reassigned by team)

4. **Display behavior**:
   - User's name continues to display normally on their content
   - User cannot log in (is_active check)
   - Email is freed for potential re-invitation

**Database safeguard**: All foreign keys to users use `ON DELETE RESTRICT` to prevent accidental hard deletion.

---

## Multi-tenancy

### Workspace Isolation

- Every data query must filter by `workspace_id`
- Users belong to exactly one workspace
- No cross-workspace data access is permitted

### URL Structure

```
/projects/:id
/boards/:id
/docs/:id
/channels/:id
/projects/:project_id/boards/:id  (items within projects)
```

---

## Permissions

### Workspace-level Actions

| Action                    | Owner | Member | Guest |
| ------------------------- | ----- | ------ | ----- |
| Manage workspace settings | Yes   | No     | No    |
| Manage workspace members  | Yes   | No     | No    |
| Create projects           | Yes   | No     | No    |
| View all projects         | Yes   | No     | No    |

### Project-level Actions

| Action                  | Owner | Project Member | Non-member |
| ----------------------- | ----- | -------------- | ---------- |
| View project            | Yes   | Yes            | No         |
| Create items in project | Yes   | Yes            | No         |
| Update own items        | Yes   | Yes            | No         |
| Delete own items        | Yes   | Yes            | No         |
| Update others' items    | Yes   | No             | No         |
| Delete others' items    | Yes   | No             | No         |

---

## Content Types

### Projects

- Container for related boards, docs, and channels
- Has members (subset of workspace members)
- Optional start/end dates

### Boards (Kanban)

- Contains tasks organized by status columns
- Default statuses: TODO, DOING, DONE
- Custom statuses can be added (DONE must always be last)

### Tasks

- Belong to a board
- Have status, assignee, due date, notes
- Can have subtasks (checklist items)
- Can have comments

### Subtasks

- Belong to a task
- Have title, completion status, assignee, notes
- Can have comments

### Documents

- Rich text content (TipTap editor)
- Can have comments

### Channels

- Team chat rooms
- Messages with threading and replies

### Direct Messages

- 1:1 conversations between workspace members

---

## Notifications

### Mention Notifications

- Created when a user is @mentioned in a comment
- Shows: who mentioned, where, preview of content
- Click navigates to the specific comment

### Notification Lifecycle

- Notifications are personal to the recipient
- Deleted when user is soft-deleted
- Can be marked as read individually or all at once

---

## Assets & Storage

### Architecture: Direct Client-to-R2

**Critical Requirement**: All file uploads and downloads MUST use presigned URLs for direct client-to-storage communication. Files should NEVER pass through the Phoenix server.

**Rationale**: Minimizes egress/ingress fees and reduces server load.

### Upload Flow

1. Client requests presigned upload URL from backend
2. Backend creates pending asset record, returns presigned URL
3. Client uploads directly to R2 (bypasses server completely)
4. Client confirms completion to backend
5. Backend marks asset as active, updates storage usage

### Download Flow

1. Client requests asset with presigned download URL
2. Backend returns asset metadata + presigned URL
3. Client downloads directly from R2

### Data Model

**Ownership**: All assets belong to the workspace, not individual users.

**Asset Types**:

- `avatar`: User profile pictures (max 5 MB)
- `file`: Any file in TipTap editors (max 25 MB)
  - Images display inline
  - Other files render as download links

**Storage Tracking**:

- Each workspace has a storage quota (default 5 GB)
- All uploads count toward quota (avatars, images, files)
- Used for billing tiers

**Lifecycle**:

- Pending → Active (on confirm)
- Delete: Immediately remove from R2, reclaim storage, delete DB record

---

## Future Considerations

(Document planned features and their expected behavior here)
