.PHONY: install typecheck test build \
        db-up db-down db-logs migrate migrate-down psql \
        dev-backend dev-frontend \
        up down clean

# ---- workspace tasks ----
install:
	cd backend && npm install
	cd frontend && npm install

typecheck:
	cd backend && npm run typecheck
	cd frontend && npm run typecheck

test:
	cd backend && npm test
	cd frontend && npm test

build:
	cd backend && npm run build
	cd frontend && npm run build

# ---- local dev (Postgres in Docker, apps on host) ----
# Start just Postgres, mapped to localhost:5432.
local-db-up:
	docker run --name taskboard-db \
		-e POSTGRES_USER=taskboard \
		-e POSTGRES_PASSWORD=password \
		-e POSTGRES_DB=taskboard \
		-p 5432:5432 -d postgres:16

# Block until Postgres accepts connections, so migrate doesn't race startup.
local-db-wait:
	@echo "waiting for postgres..."
	@until docker exec taskboard-db pg_isready -U taskboard -d taskboard >/dev/null 2>&1; do \
		sleep 1; \
	done
	@echo "postgres ready"

# Stop and remove the local Postgres container (data is not persisted).
local-db-down:
	-docker stop taskboard-db
	-docker rm taskboard-db

local-db-logs:
	docker logs -f taskboard-db

# Note: Password here must match Postgres Password above for local dev
local-env-setup:
	@test -f backend/.env || printf \
'DATABASE_URL=postgresql://taskboard:password@localhost:5432/taskboard\nPORT=4000\n' \
		> backend/.env && echo "wrote backend/.env"
	@test -f frontend/.env || printf \
'VITE_API_URL=http://localhost:4000\n' \
		> frontend/.env && echo "wrote frontend/.env"

local-env-clean:
	cd backend && rm .env
	cd frontend && rm .env

local-migrate-up:
	cd backend && npm run migrate:up

local-migrate-down:
	cd backend && npm run migrate:down

# Open a psql shell against the local DB.
local-psql:
	docker exec -it taskboard-db psql -U taskboard -d taskboard

local-up: local-env-setup local-db-up local-db-wait local-migrate-up
	@echo ""
	@echo "Local stack ready. Now start the dev servers:"
	@echo "  make local-dev          (both, in one terminal)"
	@echo "  or run 'make local-dev-backend' and 'make local-dev-frontend' separately"

local-down: local-db-down local-env-clean

local-dev:
	npx concurrently -n backend,frontend -c blue,green \
		"cd backend && npm run dev" "cd frontend && npm run dev"

# Run the dev servers (each in its own terminal).
local-dev-backend:
	cd backend && npm run dev

local-dev-frontend:
	cd frontend && npm run dev

# ---- Full stack via Docker Compose ----
up:
	docker compose up --build

down:
	docker compose down

clean:
	docker compose down -v
