# Frontend

React + TypeScript single-page application for the task board. Communicates with the backend over REST for mutations and Socket.IO for real-time updates.

## Tech Stack

| | Choice | Why |
|---|---|---|
| Framework | React 19 | Component based rendering and React is cool. |
| Language | TypeScript | Type safety between data in backend + db and frontend |
| Build tool | Vite | Fast HMR in dev; Lightweight prod builds |
| Real-time | Socket.IO client | Pairs with the backend's Socket.IO server; handles reconnection and transport fallback automatically |
| Testing | Vitest + @testing-library/react | Vitest shares Vite config with no extra overhead |

## Architecture

**No routing library.** There are only two views — Login and Board. A single `username` state value in `App` is shared between them. Adding React Router for two views would be overhead without benefit. This would need to be revisited if the scope of the project extended beyond these two views and users were actually navigating around a WebApp.

**Server as source of truth.** The contents of the page are always loaded from server responses so there's never any optimistic rendering where a card component state is updated on one client before the server has actually handled the request to update and send the contents back. This ensures that all data, for all clients, is always loaded from what the server has handled successfully. Should never have one client seeing a task as updated and another client does not see it updated because the server ran into an error.

**`useTaskState` hook.** Where all of the state is loaded from REST or from Socket events after the initial load. The state itself is just an array of Task objects where the task objects are just a json blob of the task data. There is a callback in here for the flash effect that is mapped one to one for any given task id, so no task can have multiple feedback effects playing for itself. Additionally there are event handlers for the socket events (created, updated, deleted)...these handlers are again just simple handlers that update the current list of tasks in state and apply a flash effect for new tasks.

**Types are duplicated from the backend.** `types.ts` is a deliberate copy of the backend's shared types. In a production monorepo this would live in a shared workspace package consumed by both. For a demo the duplication is preferable to the workspace coordination overhead.

## Component Structure

```
App             — Shows "Login" or Board based on stored username
├── Login       — username entry form
└── Board       — top-level board view; owns create/update/delete handlers
    ├── CreateTaskForm   — new task input bar
    └── BoardColumn × 3  — one column per status (To Do, In Progress, Done)
        └── TaskCard     — individual task card with inline edit and status dropdown
```

**`useTaskState`** (hook, not a component) — fetches initial task list over REST, then opens a Socket.IO connection and drives all subsequent state changes from socket events.

## Trade-offs & Known Limitations

**Vite dev server in Docker.** The container runs `npm run dev` rather than building static files and serving them with something like nginx. This was a deliberate choice for the demo: it keeps the Docker setup simple and supports Hot Module Reloads when the source tree is mounted as a volume, making it easy for reviewers to tweak the UI without a rebuild cycle. A production image would use `vite build` and serve the output from nginx. I deliberately chose to implement in this fashion for a few reasons.

1. I was slightly concerned I'd be futzing with UI stuff and I didn't want to have to constantly docker compose up / down anytime I wanted to test a UI change.
2. I feel like this aligns a bit more with what I would do in reality for a quick start / demo / scaffold in the span of a few hours. I would be more inclined to intentionally build production-like processes, artifacts, and deployment patters for in a more dedicated session.

**No client-side input length enforcement.** The backend rejects titles over 200 characters with a 400 error, but the frontend has no `maxLength` attribute or character counter on title inputs. The error surfaces via the action error banner rather than inline feedback on the field.

**No reconnect resync.** If the Socket.IO connection drops and reconnects, the client shows a "Connecting…" indicator but does not re-fetch the task list. Any mutations that happened during the outage will not appear until the page is refreshed.

**No delete confirmation.** Clicking Delete on a task removes it immediately with no confirmation step or undo.

**No optimistic updates.** All mutations wait for the server socket echo before updating the UI. On a fast local network this is imperceptible, but on a slow connection there is a noticeable delay between an action and its visual result. Again intentional because it keeps clients in sync but with more time you'd want some sort of "loading" feedback to give to the user.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:4000` |

Copy `.env.example` from the project root to `frontend/.env` for local development.

## Running Locally

See the root README for full local dev setup. Once the backend is running:

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

## Tests

```bash
npm test            # run once
npm run test:watch  # watch mode
```

Component tests cover: Login form validation, TaskCard rendering and interactions (status change, inline edit, delete, flash class).
