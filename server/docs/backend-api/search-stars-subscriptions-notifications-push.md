# Search, Stars, Subscriptions, Notifications, Push APIs

## Endpoint summary

| Method | Path | Auth required | Notes |
| --- | --- | --- | --- |
| POST | `/api/stars/toggle` | Yes | Toggle per-user star |
| GET | `/api/search` | Yes | Workspace search |
| GET | `/api/subscriptions/:item_type/:item_id` | Yes | List subscribers |
| GET | `/api/subscriptions/:item_type/:item_id/status` | Yes | Current user subscription status |
| POST | `/api/subscriptions/:item_type/:item_id` | Yes | Subscribe current user |
| DELETE | `/api/subscriptions/:item_type/:item_id` | Yes | Unsubscribe current user |
| GET | `/api/notifications` | Yes | Paginated notifications |
| PATCH | `/api/notifications/:id/read` | Yes | Mark one as read |
| POST | `/api/notifications/read-all` | Yes | Mark all as read |
| GET | `/api/notifications/unread-count` | Yes | Count unread |
| GET | `/api/push/vapid-key` | Yes | Fetch VAPID public key |
| POST | `/api/push/subscribe` | Yes | Register push subscription |
| DELETE | `/api/push/subscribe` | Yes | Remove push subscription |

## Stars

### POST `/api/stars/toggle`

- Request body:

```json
{
  "type": "task",
  "id": "uuid"
}
```

- Valid `type` values:
  - `project`
  - `board`
  - `doc_folder`
  - `doc`
  - `channel`
  - `direct_message`
  - `task`
- Response `200`:

```json
{
  "status": "starred|unstarred"
}
```

- Errors: `422` validation

## Search

### GET `/api/search`

- Query: `q`
- If `q` is missing/blank, returns empty arrays.
- Response `200`:

```json
{
  "data": {
    "projects": [],
    "boards": [],
    "tasks": [],
    "doc_folders": [],
    "docs": [],
    "channels": [],
    "members": []
  }
}
```

- Search is workspace-scoped and access-controlled.

## Subscriptions

Valid `item_type` values: `task`, `doc`, `channel`, `dm`, `thread`.

### GET `/api/subscriptions/:item_type/:item_id`

- Response `200`: `{"data":[Subscription...]}`

### GET `/api/subscriptions/:item_type/:item_id/status`

- Response `200`:

```json
{
  "data": {
    "subscribed": true
  }
}
```

### POST `/api/subscriptions/:item_type/:item_id`

- Body: none
- Behavior: idempotent subscribe of current user.
- Response `201`: `{"data": Subscription}`
- Errors: `422`

### DELETE `/api/subscriptions/:item_type/:item_id`

- Body: none
- Response `204` on success
- Errors: `404` if not subscribed

## Notifications

### GET `/api/notifications`

- Query params: `limit`, `after`, `before`
- Ordering: unread first, then newest.
- Response `200`: paginated `Notification[]`

### PATCH `/api/notifications/:id/read`

- Marks one notification as read.
- Response `200`: `{"data": Notification}`
- Errors: `404` if notification missing or not owned by current user

### POST `/api/notifications/read-all`

- Marks all current-user notifications as read.
- Response `200`:

```json
{
  "data": {
    "marked_count": 12
  }
}
```

### GET `/api/notifications/unread-count`

- Response `200`:

```json
{
  "data": {
    "count": 5
  }
}
```

## Push notifications

### GET `/api/push/vapid-key`

- Response `200`:

```json
{
  "data": {
    "vapid_public_key": "base64url"
  }
}
```

- Failure `503`: `{"error":"Push notifications not configured"}`

### POST `/api/push/subscribe`

- Request body:

```json
{
  "endpoint": "https://push.example/...",
  "p256dh": "key",
  "auth": "secret"
}
```

- Behavior: upsert by (`user_id`, `endpoint`).
- Response `201`:

```json
{
  "data": {
    "subscribed": true
  }
}
```

- Errors: `422`

### DELETE `/api/push/subscribe`

- Request body:

```json
{
  "endpoint": "https://push.example/..."
}
```

- Response `204` for both existing and already-missing subscriptions.
