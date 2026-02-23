.PHONY: install run test test-cov lint \
          frontend-install frontend-dev frontend-build \
          docker-build docker-up docker-up-d docker-down docker-logs \
          docker-dev-up docker-dev-down \
          clean

# ── Backend ──────────────────────────────────────────────────────────────────

## Install backend Python dependencies into the active virtualenv
install:
	pip install -r backend/requirements.txt

## Run the FastAPI dev server with auto-reload
run:
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

## Lint backend code with Ruff
lint:
	pip install ruff -q && ruff check backend/app/ --select E,W,F,I --ignore E501

## Run all backend tests
test:
	cd backend && pytest tests/ -v

## Run tests with coverage report
test-cov:
	cd backend && pytest tests/ -v --tb=short --cov=app --cov-report=term-missing

# ── Frontend ─────────────────────────────────────────────────────────────────

## Install frontend npm dependencies
frontend-install:
	cd frontend && npm install

## Run the React dev server (port 5173)
frontend-dev:
	cd frontend && npm run dev

## Build the React app for production
frontend-build:
	cd frontend && npm run build

# ── Docker (Production) ───────────────────────────────────────────────────────

## Build all production Docker images
docker-build:
	docker compose build

## Start all containers in foreground (Redis + Backend + Frontend)
docker-up:
	docker compose up

## Start all containers in background
docker-up-d:
	docker compose up -d

## Stop and remove production containers
docker-down:
	docker compose down

## View live logs from all containers
docker-logs:
	docker compose logs -f

## Rebuild and restart backend only
docker-restart-backend:
	docker compose up -d --build backend

# ── Docker (Development) ──────────────────────────────────────────────────────

## Start development containers (hot reload)
docker-dev-up:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

## Stop development containers
docker-dev-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# ── Misc ─────────────────────────────────────────────────────────────────────

## Check service health
health:
	curl -s http://localhost:8000/api/v1/health | python3 -m json.tool

## Remove Python bytecode files
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name ".pytest_cache" -delete
	find . -type d -name ".ruff_cache" -delete

## Show all available make targets
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
