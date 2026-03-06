# Multi-User Login

## Goal

Allow one device/browser to keep multiple MissionSpace accounts available and switch between them quickly, similar to Google account switching.

## Core Behavior

- A device keeps a remembered account list in the auth session (`account_user_ids`).
- `register`, `login`, and `auth/me` ensure the current user is remembered.
- `GET /api/auth/accounts` returns remembered account summaries with `current` marker.
- `POST /api/auth/switch-account` switches current session to another remembered account.
- `POST /api/auth/add-account` adds another account by credentials without switching current account.
- `POST /api/auth/logout` removes only the current account and keeps other remembered accounts.

## Limits and Safety

- Remembered accounts are capped to 10 entries.
- Account list automatically drops stale accounts (deleted/inactive/unverified/no workspace).
- Switching is only allowed for accounts already remembered in the current session.

## Frontend UX

- Login page supports account chooser when remembered accounts exist.
- Users can select a remembered account to sign in instantly.
- Users can fall back to email/password flow via "Use another account".
- Profile menu shows switch-account options and a new "Add account" modal.

## Key Files

- `server/lib/missionspace_web/controllers/auth_controller.ex`
- `server/lib/missionspace_web/router.ex`
- `server/test/missionspace_web/controllers/auth_controller_test.exs`
- `server/docs/backend-api/health-and-auth.md`
- `server/docs/backend-api/resource-schemas.md`
- `web/src/stores/authStore.ts`
- `web/src/pages/LoginPage.tsx`
- `web/src/components/features/ProfileMenu.tsx`
- `web/src/components/features/AddAccountModal.tsx`
