# Doc Folders and Docs APIs

## Endpoint summary

| Method | Path | Auth required | Notes |
| --- | --- | --- | --- |
| GET | `/api/doc-folders/suggest-prefix` | Yes | Namespace helper |
| GET | `/api/doc-folders/check-prefix` | Yes | Namespace helper |
| GET | `/api/doc-folders` | Yes | Paginated doc folders |
| POST | `/api/doc-folders` | Yes | Create doc folder |
| GET | `/api/doc-folders/:id` | Yes | Get doc folder |
| PATCH/PUT | `/api/doc-folders/:id` | Yes | Update doc folder |
| DELETE | `/api/doc-folders/:id` | Yes | Delete doc folder |
| GET | `/api/docs` | Yes | Paginated docs |
| POST | `/api/docs` | Yes | Create doc |
| GET | `/api/docs/:id` | Yes | Get doc |
| PATCH/PUT | `/api/docs/:id` | Yes | Update doc |
| DELETE | `/api/docs/:id` | Yes | Delete doc |

## Doc folder prefix helpers

### GET `/api/doc-folders/suggest-prefix`

- Query: `name`
- Response `200`:

```json
{
  "data": {
    "prefix": "ABC"
  }
}
```

### GET `/api/doc-folders/check-prefix`

- Query: `prefix`
- Response `200`:

```json
{
  "data": {
    "available": true
  }
}
```

Notes:

- Prefix namespace is shared with boards; collisions are cross-type.

## Doc folders

### GET `/api/doc-folders`

- Query params: `limit`, `after`, `before`
- Response `200`: paginated `DocFolder[]`

### POST `/api/doc-folders`

- Request body (top-level):

```json
{
  "name": "Product Docs",
  "prefix": "DOC",
  "visibility": "shared"
}
```

- Notes:
  - `workspace_id` and `created_by_id` are injected.
  - Prefix required on create, immutable on update.
- Response `201`: `{"data": DocFolder}`
- Errors: `403`, `422`

### GET `/api/doc-folders/:id`

- Response `200`: `{"data": DocFolder}`
- Errors: `403`, `404`

### PATCH/PUT `/api/doc-folders/:id`

- Request body: mutable fields (`name`, `visibility`)
- `prefix` in body is ignored by changeset (immutable contract).
- Response `200`: `{"data": DocFolder}`
- Errors: `403`, `404`, `422`

### DELETE `/api/doc-folders/:id`

- Response `204`
- Behavior: releases reserved prefix namespace entry.
- Errors: `403`, `404`

## Docs

### GET `/api/docs`

Supported query params:

- `starred=true` -> starred docs only
- `doc_folder_id=<uuid>` -> folder filter
- pagination: `limit`, `after`, `before`

- Response `200`: paginated `Doc[]`

### POST `/api/docs`

- Request body (top-level):

```json
{
  "title": "API Guide",
  "content": "# markdown",
  "doc_folder_id": "uuid"
}
```

- Behavior:
  - `author_id` and `workspace_id` are injected.
  - Sequence number is assigned from folder counter.
  - Creator is auto-subscribed to the doc.
  - Markdown content is sanitized server-side.
- Response `201`: `{"data": Doc}`
- Errors: `403`, `404`, `422`

### GET `/api/docs/:id`

- Response `200`: `{"data": Doc}`
- Errors: `403`, `404`

### PATCH/PUT `/api/docs/:id`

- Request body: mutable doc fields (`title`, `content`, etc.)
- Behavior:
  - Content updates are sanitized.
  - Newly added mentions in content can trigger async mention notifications.
- Response `200`: `{"data": Doc}`
- Errors: `403`, `404`, `422`

### DELETE `/api/docs/:id`

- Response `204`
- Errors: `403`, `404`
