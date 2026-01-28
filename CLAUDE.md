# CLAUDE.md

This file provides guidance for Claude Code when working on the Bridge codebase.

## Project Overview

Bridge is a team collaboration app with Docs (rich text posts), Lists (task management), and Chat (channels/DMs). It's a PWA built with Phoenix (Elixir) backend and React frontend.

## Repository Structure

```
bridge/
├── server/           # Phoenix backend (Elixir)
│   ├── lib/
│   │   ├── bridge/           # Business logic contexts
│   │   └── bridge_web/       # Web layer (controllers, channels)
│   ├── priv/repo/migrations/
│   └── mix.exs
│
└── web/              # React PWA frontend
    ├── src/
    │   ├── components/       # React components
    │   ├── pages/            # Route pages
    │   ├── stores/           # Zustand state
    │   ├── hooks/            # Custom hooks
    │   └── lib/              # Utilities
    └── package.json
```

## Tech Stack

**Backend:** Elixir, Phoenix 1.7+, Phoenix Channels, Ecto, PostgreSQL
**Frontend:** React 18, Vite, TypeScript, Zustand, Tailwind CSS, Tiptap

## Development Commands

### Server (Phoenix)

```bash
cd server
mix deps.get          # Install dependencies
mix ecto.setup        # Create DB, run migrations, seed
mix phx.server        # Start server at localhost:4000
mix test              # Run tests
mix format            # Format code
```

### Web (React)

```bash
cd web
npm install           # Install dependencies
npm run dev           # Start dev server at localhost:5173
npm run build         # Production build
npm run lint          # Run ESLint
npm run typecheck     # Run TypeScript check
```

### Database

```bash
cd server
mix ecto.create       # Create database
mix ecto.migrate      # Run migrations
mix ecto.rollback     # Rollback last migration
mix ecto.reset        # Drop, create, migrate, seed
```

## Code Style & Conventions

### Elixir (Server)

- Use Phoenix contexts for business logic (e.g., `Bridge.Lists`, `Bridge.Chat`)
- Controllers are thin—delegate to contexts
- Use changesets for all data validation
- Pattern match liberally
- Pipelines over nested function calls
- **Always use `timestamptz` for timestamps in migrations** for timezone-aware timestamps
- Backend APIs return snake_case JSON (frontend handles conversion to camelCase)

```elixir
# Good
def create_task(list_id, attrs) do
  %Task{}
  |> Task.changeset(attrs)
  |> Ecto.Changeset.put_assoc(:list_id, list_id)
  |> Repo.insert()
end

# Avoid
def create_task(list_id, attrs) do
  Repo.insert(Ecto.Changeset.put_assoc(Task.changeset(%Task{}, attrs), :list_id, list_id))
end
```

### TypeScript (Web)

- Functional components only (no classes)
- Use TypeScript strictly—avoid `any`
- Colocate components with their styles/types when possible
- Use Zustand for global state, React state for local UI state
- Prefix hooks with `use` (e.g., `useChannel`, `useApi`)

```typescript
// Good - typed, functional, clear
interface TaskCardProps {
  task: Task
  onClick: (id: string) => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  return (
    <div onClick={() => onClick(task.id)}>
      {task.title}
    </div>
  )
}
```

### Tailwind CSS

- Use Tailwind utility classes directly
- Extract components, not CSS classes
- Dark theme uses slate color palette
- Follow existing spacing/sizing tokens

## Key Architectural Decisions

### Real-time Updates

Use Phoenix Channels for all real-time features:

- Chat messages
- Task updates
- Presence (online status)
- Typing indicators

```typescript
// Frontend: Subscribe to channel
const channel = useChannel(`list:${listId}`, (event, payload) => {
  if (event === "task_updated") {
    listStore.updateTask(payload);
  }
});

// Backend: Broadcast changes
BridgeWeb.Endpoint.broadcast("list:#{list_id}", "task_updated", task);
```

### State Management

- **Zustand** for global app state (auth, entities, UI state)
- **React state** for local component state (form inputs, open/closed)
- **URL** for navigation state (current page, selected item)

```typescript
// Zustand store pattern
export const useListStore = create<ListStore>((set, get) => ({
  lists: [],
  tasks: {},

  fetchLists: async () => {
    const lists = await api.get("/lists");
    set({ lists });
  },

  updateTask: (task) =>
    set((state) => ({
      tasks: { ...state.tasks, [task.id]: task },
    })),
}));
```

### Comments & Threading

All comments (on tasks, subtasks, docs) and chat messages share the same model:

- One level of threading (replies to a message)
- Any message can quote any other message
- Thread panel always opens on right sidebar

### Two-Sidebar Layout

- **Outer sidebar (56px):** Fixed icons for Home, Projects, Lists, Docs, Channels, DMs
- **Inner sidebar (208px):** Collapsible, shows items for selected category
- **Main content:** Active item view
- **Detail panel:** Task details, thread panel (right side)

## File Naming Conventions

```
# Components: PascalCase
components/TaskCard.tsx
components/ui/Button.tsx

# Hooks: camelCase with use prefix
hooks/useChannel.ts
hooks/useApi.ts

# Stores: camelCase with Store suffix
stores/listStore.ts
stores/authStore.ts

# Types: camelCase
types/task.ts
types/index.ts

# Elixir: snake_case
lib/bridge/lists/task.ex
lib/bridge_web/controllers/task_controller.ex
```

## Testing

### Backend

```bash
mix test                      # All tests
mix test test/bridge/lists    # Specific context
mix test --cover              # With coverage
```

### Frontend

```bash
npm run test                  # Run tests
npm run test:watch            # Watch mode
npm run test:coverage         # With coverage
```

## Common Tasks

### Adding a new API endpoint

1. Add route in `server/lib/bridge_web/router.ex`
2. Create/update controller in `server/lib/bridge_web/controllers/`
3. Add context function in `server/lib/bridge/`
4. Add API call in `web/src/lib/api.ts`
5. Update relevant Zustand store

### Adding a new Phoenix Channel

1. Create channel in `server/lib/bridge_web/channels/`
2. Add to socket in `server/lib/bridge_web/channels/user_socket.ex`
3. Create `useChannel` hook usage in React component
4. Handle events in Zustand store

### Adding a new page

1. Create page component in `web/src/pages/`
2. Add route in `web/src/router.tsx`
3. Add navigation in sidebar components

## Environment Variables

### Server (.env)

```
DATABASE_URL=postgres://postgres:postgres@localhost/bridge_dev
SECRET_KEY_BASE=your-secret-key
PHX_HOST=localhost
```

### Web (.env)

```
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/socket
```

## Troubleshooting

### Phoenix won't start

```bash
# Check PostgreSQL is running
docker-compose up -d

# Reset database
mix ecto.reset
```

### WebSocket connection fails

- Ensure Phoenix server is running
- Check VITE_WS_URL matches Phoenix host
- Verify authentication token is being sent

### Styles not updating

```bash
# Restart Vite dev server
npm run dev

# Clear Tailwind cache
rm -rf node_modules/.vite
```

## Reference

- PRD: See `docs/PRD.md` for full product requirements
- UI Prototype: See `docs/prototype.html` for interactive mockup
- Phoenix Docs: https://hexdocs.pm/phoenix
- React Docs: https://react.dev
- Zustand Docs: https://zustand-demo.pmnd.rs
