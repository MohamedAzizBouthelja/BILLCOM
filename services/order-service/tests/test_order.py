import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import jwt
from datetime import datetime, timedelta, timezone
import os
import sys
from unittest.mock import patch, MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import Base, get_db
from app.main import app
from app.models import Order
from app.config import JWT_SECRET, JWT_ALGORITHM

# Configuration de la base de données de test SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_order.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Nettoyer et réinitialiser la BD de test
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Utilitaire de génération de token JWT de test
def generate_test_token(username: str, role: str) -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

@pytest.fixture(autouse=True)
def run_before_and_after_tests():
    db = TestingSessionLocal()
    db.query(Order).delete()
    db.commit()
    db.close()
    yield

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "order-service"}

@patch('requests.get')
def test_create_order_product_not_found(mock_get):
    # Mock product service returning 404
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_get.return_value = mock_response

    token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"product_id": 99, "quantity": 1}

    response = client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Le produit spécifié n'existe pas"

@patch('requests.get')
def test_create_order_insufficient_stock(mock_get):
    # Mock product service returning product with stock=0
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 0
    }
    mock_get.return_value = mock_response

    token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"product_id": 1, "quantity": 2}

    response = client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Stock insuffisant pour ce produit"

@patch('requests.get')
def test_create_order_success(mock_get):
    # Mock product service returning product with enough stock
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 5
    }
    mock_get.return_value = mock_response

    token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"product_id": 1, "quantity": 2}

    response = client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["product_id"] == 1
    assert data["quantity"] == 2
    assert data["total_price"] == 2000.0
    assert data["username"] == "testuser"
    assert "id" in data

@patch('requests.get')
def test_get_order_by_id_rbac(mock_get):
    # 1. Créer une commande réussie
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"id": 1, "name": "Laptop", "price": 1000.0, "stock": 5}
    mock_get.return_value = mock_response

    user1_token = generate_test_token("user1", "user")
    user2_token = generate_test_token("user2", "user")
    admin_token = generate_test_token("admin", "admin")

    create_res = client.post("/api/v1/orders", json={"product_id": 1, "quantity": 1}, headers={"Authorization": f"Bearer {user1_token}"})
    order_id = create_res.json()["id"]

    # 2. Récupérer par son propriétaire (succès)
    res_owner = client.get(f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {user1_token}"})
    assert res_owner.status_code == 200
    assert res_owner.json()["username"] == "user1"

    # 3. Récupérer par un autre utilisateur (échec 403)
    res_other = client.get(f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {user2_token}"})
    assert res_other.status_code == 403

    # 4. Récupérer par l'administrateur (succès)
    res_admin = client.get(f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert res_admin.json()["username"] == "user1"
