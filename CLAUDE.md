# Bridge Development Documentation

This document contains important patterns and conventions used in the Bridge project.

## Authentication & Authorization

All API endpoints require authentication and workspace context through JWT tokens.

Critical: All queries must filter by workspace_id to prevent cross-workspace data leakage.

## UUIDv7

Package: {:uuidv7, "~> 1.0"}

Schema Pattern:
@primary_key {:id, UUIDv7, autogenerate: true}
@foreign_key_type Ecto.UUID

Benefits: Time-ordered IDs, better database index performance, distributed-safe.

## Pagination

Package: {:paginator, "~> 1.2"}

All list endpoints use cursor-based pagination for better performance and consistency.

Default limit: 50 items per page
Always use desc: id for default sorting

Query parameters:
- after: Cursor for next page
- before: Cursor for previous page
- limit: Items per page

## Database Indices

Composite indices on (workspace_id, id) for optimal pagination performance.
Both single-column and composite indices are maintained.

## Critical Rules

1. Always filter by workspace_id in queries
2. Always use desc: id for default sorting in paginated queries
3. Use UUIDv7 for all primary keys
4. Use cursor-based pagination for all list endpoints
5. Maintain composite indices for (workspace_id, id) on paginated resources
