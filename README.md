# Auxilius Task Board Assignment

A real-time collaborative task board where multiple users can create, update, and manage tasks simultaneously. Built as a full-stack take-home assignment.

## Quick Start

```bash
cp .env.example .env

# I'm a sucker for a good makefile
make up
```

Then open **http://localhost:5173** in one or more browser tabs. Enter any username to get started

> **Note:** The first startup runs database migrations automatically before the backend boots. Subsequent runs from docker compose will reuse the DB that was mounted from disk.

## Tear down

Ctrl-C back to a shell and then just
```bash
make down
```

To bring down all of the containers.

to fully clean any data stored locally for the DB run:

```bash
make clean
```

## Features

- Username-based login persisted to `localStorage`
- Create tasks with a title and optional description
- Three-column board layout: To Do / In Progress / Done
- Update task title, description, or status via inline editing
- Delete tasks
- Real-time sync across all connected clients via Socket.IO — no page refresh needed
- Visual flash on any card that was just created or updated
- Live connection status indicator

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│                                                                  │
│  React                          Socket.IO client                 │
└──────────┬───────────────────────────────────▲──────────────────┘
           │ REST                               │ real-time events
           │ GET /tasks                         │ task:created
           │ POST /tasks                        │ task:updated
           │ PATCH /tasks/:id                   │ task:deleted
           │ DELETE /tasks/:id                  │
           ▼                                    │
┌───────────────────────────────────────────────┴──────────────────┐
│  Backend (Express + Socket.IO)                                    │
│                                                                   │
│  tasks.router → tasks.repository → tasks.validation              │
└───────────────────────────────────────┬──────────────────────────┘
                                        │ SQL (node-postgres)
                                        ▼
                             ┌──────────────────────┐
                             │  PostgreSQL           │
                             │  tasks table          │
                             └──────────────────────┘
```

All three services run as Docker containers orchestrated by `docker-compose.yml`. The backend waits for a healthy Postgres connection before starting, then runs pending migrations before the server begins accepting requests.

See [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md) for detailed documentation on each service.

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Backend | Express 5, TypeScript, Node.js |
| Database | PostgreSQL 16 |
| Real-time | Socket.IO |
| Schema migrations | node-pg-migrate |
| Testing | Vitest, supertest, @testing-library/react |
| Infrastructure | Docker, Docker Compose, Make |

See the service READMEs in backend/README.md and frontend/README.md for the reasoning behind each choice.

## Key Technical Decisions

**Server echo as source of truth.** When a client mutates a task, the REST call goes to the server, which writes to the database and then broadcasts the result to all connected clients via Socket.IO — including the client that made the change. No client updates its own state directly. This means every client, regardless of who triggered the action, follows the same update code path and sees only data the server has confirmed. The trade-off is a small round-trip delay on every action.

**`createApp` factory + `Broadcaster` interface.** The Express app is built by a factory that accepts an injected pool and broadcaster. `index.ts` owns the real Socket.IO server; tests pass in a mock. This keeps the app layer completely decoupled from the network and makes the test suite fast and dependency-free — no database or socket server required.

**UUID primary key + sequential `task_number`.** Tasks have a UUID as their stable API and database identifier, and a separate Postgres identity column (`task_number`) for the human-readable `TASK-N` label shown in the UI. Keeping them separate means the legible ID is always compact and monotonically increasing without compromising the UUID's properties as a stable key.

**Vite dev server in Docker.** The frontend container runs `npm run dev` with the source tree mounted as a volume rather than building a static bundle. This supports HMR for reviewers who want to tweak the UI without a rebuild cycle. A production deployment would use `vite build` and serve static assets backed by nginx.

## Known Limitations

- **No API authentication.** The username never leaves the browser; any client can mutate any task. Explicitly out of scope for this assignment.
- **No reconnect resync.** If a client's socket drops and reconnects, it does not re-fetch the task list — any missed updates won't appear until a page refresh.
- **No delete confirmation.** Tasks are removed immediately on click with no undo or confirmation.
- **CORS is wide open.** Both Express and Socket.IO accept any origin. Fine for a demo; a production deployment would lock this down.
- **Limited input feedback** Title is restricted to 200 chars and you can't submit a task without a title. The input block doesn't reflect the char length restriction(oversight by me) and the Add Task button is just greyed out until the user adds a title. So the user is just allowed to send a known bad request and the Error is just displayed in a banner back to the user...could make that nicer.

## What I'd Add With More Time

- **Real CI/CD!!** I tried to ensure there was adequate test coverage for everything but building this into GHA so linting and unit tests are handled on every PR would be a must have.
- **Shared types package.** `types.ts` is currently copy-pasted between frontend and backend. A monorepo workspace package would eliminate the duplication and guarantee parity.
- **ORM.** Raw SQL in heredocs works but doesn't scale well. TypeORM or something similar would provide type-safe query building and better schema-to-object mapping.
- **OpenAPI spec + generated validation.** Hand-rolled validation in `tasks.validation.ts` works but drifts from the API contract over time. An OpenAPI spec with generated runtime validators keeps them in sync automatically.
- **Production frontend image.** Replace the Vite dev server container with a multi-stage build that produces a static bundle served by nginx.
- **Reconnect resync.** Re-fetch the task list when the socket reconnects after a drop.
- **Rate limiting.** `express-rate-limit` on mutation endpoints to prevent abuse.
- **Real hosting infrastructure** Could host the containers in ECS and front them pretty easily to get a real app off the ground. Would be trivial to restrict by IP for demo purposes
- **All sorts of features** Drag and drop, delete confirmation / undo, user attribution, task search, sort by date, multiple projects / workspaces etc.
- **Cleanup favicon and tab title, and add a real Component library** Still using the default Vite icons and project name and raw CSS. Real component library would make this feel a little more mature

## Time Log

| Phase | Time spent |
|---|---|
| Project scaffolding and unit tests | 30 mins |
| DB, Backend, Frontend composed via Docker and Make | ~15 mins |
| API Stub with DB interaction | ~30 mins |
| Realtime connectivity | ~45 mins |
| Project documentation and cleanup | ~30 mins |
| **Total** | 150 minutes |

## Environment Variables

All variables are documented in `.env.example`. Copy it to `.env` before running:

```bash
cp .env.example .env
make up
```
