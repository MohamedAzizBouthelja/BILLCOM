#!/bin/bash
set -e

echo "[startup] Running Alembic migrations..."
alembic upgrade head
echo "[startup] Migrations done. Starting order-service..."
exec python app/main.py
