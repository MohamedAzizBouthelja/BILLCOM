# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Billcom is a microservices-based e-commerce platform. Three FastAPI backend services sit behind an Nginx API gateway, with a React/Vite frontend and MySQL databases per service.

## Running the Stack

```bash
# Full stack (recommended for development)
docker-compose up

# Individual service rebuild after code changes
docker-compose up --build <service-name>

# Tear down
docker-compose down
```

Services exposed via Nginx gateway at `https://localhost`.

## Frontend Development

```bash
cd frontend
npm install
npm run dev        # Dev server on port 3000
npm run build      # Production build
npm run preview    # Preview production build
```

## Backend Services

Each service runs independently with its own virtualenv:

```bash
cd services/<service-name>
pip install -r requirements.txt
uvicorn app.main:app --reload --port <port>
```

Ports: user-service `8001`, product-service `8002`, order-service `8003`.

## Testing

```bash
# Run all tests for a service
pytest services/user-service/tests/
pytest services/product-service/tests/
pytest services/order-service/tests/

# Single test file
pytest services/user-service/tests/test_user.py -v
```

Tests use an in-memory SQLite database (overrides `DATABASE_URL` in fixtures).

## Database Setup (without Docker)

```bash
python setup_db.py          # Create/recreate all tables
python recreate_products.py # Seed product data
python recreate_orders.py   # Seed order data
```

## Architecture

```
frontend/          React 18 + Vite + TailwindCSS + Zustand
gateway/           Nginx — SSL termination, rate limiting, routes /api/users|products|orders
services/
  user-service/    FastAPI — auth (JWT), registration, user management (MySQL: user_db)
  product-service/ FastAPI — product CRUD, catalog seeding (MySQL: product_db)
  order-service/   FastAPI — order management + Redis caching (MySQL: order_db)
db-init/           init.sql runs on MySQL container startup
```

### Key Files

| File | Purpose |
|------|---------|
| [docker-compose.yml](docker-compose.yml) | Full orchestration — env vars, health checks, service dependencies |
| [gateway/nginx.conf](gateway/nginx.conf) | Route mapping, SSL, rate limiting, Prometheus metrics endpoint |
| [frontend/src/lib/api.js](frontend/src/lib/api.js) | All API calls to backend services |
| [frontend/src/lib/store.js](frontend/src/lib/store.js) | Zustand store — auth state, cart, products |
| [services/user-service/app/auth.py](services/user-service/app/auth.py) | JWT creation/validation, password hashing |

### Auth Flow

JWT tokens are issued by user-service and validated at the application layer (not at Nginx). The frontend stores the token in Zustand and attaches it as `Authorization: Bearer <token>` via `api.js`.

### Inter-Service Communication

Services are isolated — they do not call each other. The order-service caches order results in Redis to reduce DB load. Product data is seeded on startup if the `products` table is empty.

### Frontend State

Zustand store (`store.js`) holds three slices: `auth` (user/token), `cart` (items/total), `products` (catalog). API calls are centralized in `api.js`; components dispatch to the store via hooks in `src/hooks/`.
