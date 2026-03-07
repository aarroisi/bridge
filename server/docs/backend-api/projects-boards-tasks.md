# Projects, Boards, and Tasks APIs

## Endpoint summary

| Method | Path | Auth required | Notes |
| --- | --- | --- | --- |
| GET | `/api/projects` | Yes | Paginated projects |
| POST | `/api/projects` | Yes | Create project (owner only) |
| GET | `/api/projects/:id` | Yes | Get project |
| PATCH/PUT | `/api/projects/:id` | Yes | Update project (owner only) |
| DELETE | `/api/projects/:id` | Yes | Delete project (owner only) |
| GET | `/api/projects/:project_id/items` | Yes | List items in project |
| POST | `/api/projects/:project_id/items` | Yes | Add item to project (owner only) |
| DELETE | `/api/projects/:project_id/items/:id` | Yes | Remove project item (owner only) |
| GET | `/api/boards/suggest-prefix` | Yes | Namespace helper |
| GET | `/api/boards/check-prefix` | Yes | Namespace helper |
| GET | `/api/boards` | Yes | Paginated boards |
| POST | `/api/boards` | Yes | Create board |
| GET | `/api/boards/:id` | Yes | Get board with statuses/tasks |
| PATCH/PUT | `/api/boards/:id` | Yes | Update board |
| DELETE | `/api/boards/:id` | Yes | Delete board |
| GET | `/api/boards/:list_id/statuses` | Yes | List statuses |
| POST | `/api/boards/:list_id/statuses` | Yes | Create status |
| PUT | `/api/boards/:list_id/statuses/reorder` | Yes | Reorder statuses |
| PATCH | `/api/statuses/:id` | Yes | Update status |
| DELETE | `/api/statuses/:id` | Yes | Delete status |
| GET | `/api/tasks` | Yes | List tasks by mode/filter |
| POST | `/api/tasks` | Yes | Create task |
| GET | `/api/tasks/:id` | Yes | Get task |
| PATCH/PUT | `/api/tasks/:id` | Yes | Update task |
| DELETE | `/api/tasks/:id` | Yes | Delete task |
| PUT | `/api/tasks/:id/reorder` | Yes | Reorder task / move status |

## Projects

### GET `/api/projects`

- Query params: `limit`, `after`, `before`
- Access: filtered by project authorization; owners see all accessible projects.
- Response `200`: paginated `Project[]`

### POST `/api/projects`

- Authorization: owner-only (`manage_projects`)
- Request body (top-level):

```json
{
  "name": "Project X",
  "description": "optional",
  "start_date": "2026-03-01",
  "end_date": "2026-04-01",
  "member_ids": ["user-uuid", "..."]
}
```

- Notes:
  - `workspace_id` and `created_by_id` are injected server-side.
  - `member_ids` is optional and processed after project insert.
- Response `201`: `{"data": Project}`
- Errors: `403`, `422`

### GET `/api/projects/:id`

- Response `200`: `{"data": Project}`
- Errors: `403` or `404`

### PATCH/PUT `/api/projects/:id`

- Authorization: owner-only
- Request body: top-level project fields (`name`, `description`, `start_date`, `end_date`)
- Response `200`: `{"data": Project}`
- Errors: `403`, `404`, `422`

### DELETE `/api/projects/:id`

- Authorization: owner-only
- Response `204` empty body
- Errors: `403`, `404`

## Project items

Project items link projects to boards/doc folders/channels.

### GET `/api/projects/:project_id/items`

- Response `200`: `{"data": [ProjectItem...]}`

### POST `/api/projects/:project_id/items`

- Authorization: owner-only
- Request body:

```json
{
  "item_type": "board",
  "item_id": "uuid"
}
```

- Notes:
  - API accepts `board`; backend stores it as `list`.
  - Also accepts `doc_folder` and `channel`.
- Response `201`: `{"data": ProjectItem}`
- Errors: `403`, `404`, `422`

### DELETE `/api/projects/:project_id/items/:id`

- Authorization: owner-only
- `:id` format is `type:item_id` (example: `board:4a2f...`).
- Response `204` empty body
- Errors: `403`, `404`

## Boards (lists)

### GET `/api/boards/suggest-prefix`

- Query: `name`
- Response `200`:

```json
{
  "data": {
    "prefix": "ABC"
  }
}
```

### GET `/api/boards/check-prefix`

- Query: `prefix`
- Response `200`:

```json
{
  "data": {
    "available": true
  }
}
```

### GET `/api/boards`

- Query params:
  - pagination (`limit`, `after`, `before`)
- Response `200`: paginated `Board[]`

### POST `/api/boards`

- Request body:

```json
{
  "name": "Engineering",
  "prefix": "ENG",
  "visibility": "shared"
}
```

- Notes:
  - `prefix` required on create, immutable on update.
  - `created_by_id` and `workspace_id` are injected.
  - Default statuses are auto-created: TODO, DOING, DONE.
- Response `201`: `{"data": Board}`
- Errors: `422` (name/prefix/visibility/uniqueness), `403`

### GET `/api/boards/:id`

- Response `200`: `{"data": Board}` with statuses and top-level tasks.
- Errors: `403`, `404`

### PATCH/PUT `/api/boards/:id`

- Request body: top-level mutable board fields (`name`, `visibility`)
- Response `200`: `{"data": Board}`
- Errors: `403`, `404`, `422`

### DELETE `/api/boards/:id`

- Response `204`
- Errors: `403`, `404`

## Board statuses

### GET `/api/boards/:list_id/statuses`

- Response `200`: `{"data":[ListStatus...]}` ordered by `position`

### POST `/api/boards/:list_id/statuses`

- Request body:

```json
{
  "name": "Review",
  "color": "#8b5cf6"
}
```

- Notes:
  - Name is uppercased server-side.
  - If DONE exists, new status is inserted before DONE.
- Response `201`: `{"data": ListStatus}`
- Errors: `404`, `422`

### PUT `/api/boards/:list_id/statuses/reorder`

- Request body:

```json
{
  "status_ids": ["status-uuid-1", "status-uuid-2", "..."]
}
```

- Constraint: DONE status must remain last (`done_must_be_last`).
- Response `200`: `{"data":[ListStatus...]}`
- Errors: `404`, `422`

### PATCH `/api/statuses/:id`

- Request body: mutable status fields (`name`, `color`, `position`, `is_done`)
- Response `200`: `{"data": ListStatus}`
- Errors: `404`, `422`

### DELETE `/api/statuses/:id`

- Response `204`
- Errors:
  - `404` not found
  - `422` when deleting DONE status
  - `422` when status still has tasks

## Tasks

### GET `/api/tasks`

Supported query modes (evaluated by controller pattern matching):

- `?starred=true` -> all starred tasks in workspace
- `?assigned_to_me=true&is_subtask=true` -> child tasks assigned to current user
- `?assigned_to_me=true` -> top-level tasks assigned to current user
- `?parent_id=<task_id>` -> child tasks for a parent
- `?list_id=<board_id>` or `?board_id=<board_id>` -> paginated top-level tasks in board
- no recognized filter -> empty list

Pagination applies in board listing mode via `limit/after/before`.

Response `200`:

- paginated `ListResponse<Task>` in paginated mode
- otherwise `{"data":[Task...]}`

### POST `/api/tasks`

- Request body (top-level):

```json
{
  "title": "Fix bug",
  "list_id": "board-uuid",
  "status_id": "status-uuid",
  "description": "optional",
  "assignee_id": "user-uuid",
  "due_on": "2026-03-20",
  "parent_id": "task-uuid"
}
```

- Compatibility aliases accepted:
  - `boardId` or `board_id` (mapped to `list_id`)
  - `parentId` (mapped to `parent_id`)

- Behavior:
  - `created_by_id` is injected from current user.
  - If `status_id` missing, defaults to board's first status.
  - Creates task sequence number for board key generation.
  - Auto-subscribes creator to task.

- Response `201`: `{"data": Task}`
- Errors: `422` validation, `403` authorization, `404` resource lookup errors

### GET `/api/tasks/:id`

- Response `200`: `{"data": Task}`
- Errors: `403`, `404`

### PATCH/PUT `/api/tasks/:id`

- Request body: mutable task fields (`title`, `description`, `status_id`, `assignee_id`, etc.)
- Behavior:
  - Updates completion timestamps based on status/`is_completed` transitions.
  - If description changed, detects newly added `member:<uuid>` mentions and creates mention notifications + subscriptions.
- Response `200`: `{"data": Task}`
- Errors: `403`, `404`, `422`

### DELETE `/api/tasks/:id`

- Response `204`
- Errors: `403`, `404`

### PUT `/api/tasks/:id/reorder`

- Request body:

```json
{
  "position": 0,
  "status_id": "optional-target-status-uuid"
}
```

- Behavior:
  - Repositions task within a status lane or moves across lanes.
  - Recomputes ordering position number.
- Response `200`: `{"data": Task}`
- Errors: `403`, `404`, `422`
