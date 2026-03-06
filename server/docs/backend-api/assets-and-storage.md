# Assets and Storage APIs

## Endpoint summary

| Method | Path | Auth required | Notes |
| --- | --- | --- | --- |
| POST | `/api/assets/request-upload` | Yes | Create pending asset + presigned upload URL |
| POST | `/api/assets/:id/confirm` | Yes | Confirm upload and activate asset |
| GET | `/api/assets/:id` | Yes | Get asset with download URL |
| DELETE | `/api/assets/:id` | Yes | Delete asset |
| GET | `/api/workspace/storage` | Yes | Workspace usage/quota |

## Asset model constraints

- Asset types: `avatar`, `file`
- Statuses: `pending`, `active`
- Attachable types: `doc`, `message`, `user`, `task`, `channel`, `dm`, `workspace`
- Max size:
  - `avatar`: `5 MB`
  - `file`: `25 MB`

## POST `/api/assets/request-upload`

- Request body:

```json
{
  "filename": "report.pdf",
  "content_type": "application/pdf",
  "size_bytes": 102400,
  "asset_type": "file",
  "attachable_type": "doc",
  "attachable_id": "uuid"
}
```

- Behavior:
  - Validates file size and workspace storage quota.
  - Validates attachable ownership in current workspace.
  - Creates a pending asset row.
  - Returns a presigned upload URL.

- Response `201`:

```json
{
  "data": {
    "id": "uuid",
    "upload_url": "https://...",
    "storage_key": "string"
  }
}
```

- Common errors (`422`):
  - `{"error":"File too large"}`
  - `{"error":"Storage quota exceeded"}`
  - `{"error":"attachable_type is required"}`
  - `{"error":"attachable_id is required"}`
  - `{"error":"Invalid attachable_type. Must be one of: ..."}`
  - `{"error":"Attachable item not found in this workspace"}`
  - `{"error":"Message has invalid entity type"}`
  - standard `{"errors": {...}}` changeset payload

## POST `/api/assets/:id/confirm`

- Confirms upload completion.
- Marks asset as `active` and increments workspace storage usage.
- Response `200`: `{"data": Asset}` (includes `url` when presign succeeds)
- Errors:
  - `404` not found
  - `422` `{"error":"Asset is not pending"}`
  - `500` `{"error":"Failed to confirm upload"}`

## GET `/api/assets/:id`

- Returns asset metadata and a presigned download URL (if available).
- Response `200`: `{"data": Asset}`
- Errors: `404`

## DELETE `/api/assets/:id`

- Deletes storage object (best effort), reclaims usage for active assets, then deletes DB row.
- Response `204`
- Errors:
  - `404` not found
  - `500` `{"error":"Failed to delete asset"}`

## GET `/api/workspace/storage`

- Response `200`:

```json
{
  "data": {
    "used_bytes": 1000000,
    "quota_bytes": 5368709120,
    "available_bytes": 5367709120
  }
}
```

- Errors: `404` if workspace missing
