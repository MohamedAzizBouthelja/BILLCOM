import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import jwt
import json
from datetime import datetime, timedelta, timezone
import os
import sys
from unittest.mock import patch, MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import Base, get_db
from app.main import app
from app.models import Order
from app.config import JWT_SECRET, JWT_ALGORITHM

# Configuration de la base de données de test SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_order.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
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
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
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


@patch("requests.get")
def test_create_order_product_not_found(mock_get):
    # Mock product service returning 404
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_get.return_value = mock_response

    token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "order_number": "GZ-TEST-1",
        "product_id": 99,
        "quantity": 1,
        "total_price": 100.0,
    }

    response = client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Produit 99 introuvable"


@patch("requests.get")
def test_create_order_insufficient_stock(mock_get):
    # Mock product service returning product with stock=0
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 0,
    }
    mock_get.return_value = mock_response

    token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "order_number": "GZ-TEST-2",
        "product_id": 1,
        "quantity": 2,
        "total_price": 2000.0,
    }

    response = client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Stock insuffisant pour Laptop"


@patch("requests.get")
def test_create_order_success(mock_get):
    # Mock product service returning product with enough stock
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 5,
    }
    mock_get.return_value = mock_response

    token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "order_number": "GZ-TEST-3",
        "product_id": 1,
        "quantity": 2,
        "total_price": 2000.0,
    }

    response = client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["product_id"] == 1
    assert data["quantity"] == 2
    assert data["total_price"] == 2000.0
    assert data["username"] == "testuser"
    assert "id" in data


@patch("requests.get")
def test_create_order_ignores_tampered_total_price(mock_get):
    # The client claims total_price=1.0 for a product that really costs 1000.0
    # per unit — the server must recompute from product-service, not trust it.
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 5,
    }
    mock_get.return_value = mock_response

    token = generate_test_token("attacker", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "order_number": "GZ-TEST-TAMPER",
        "items": [{"id": 1, "quantity": 2}],
        "total_price": 1.0,
    }

    response = client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 201
    assert response.json()["total_price"] == 2000.0


@patch("requests.get")
def test_get_order_by_id_rbac(mock_get):
    # 1. Créer une commande réussie
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 5,
    }
    mock_get.return_value = mock_response

    user1_token = generate_test_token("user1", "user")
    user2_token = generate_test_token("user2", "user")
    admin_token = generate_test_token("admin", "admin")

    create_res = client.post(
        "/api/v1/orders",
        json={
            "order_number": "GZ-TEST-4",
            "product_id": 1,
            "quantity": 1,
            "total_price": 1000.0,
        },
        headers={"Authorization": f"Bearer {user1_token}"},
    )
    order_id = create_res.json()["id"]

    # 2. Récupérer par son propriétaire (succès)
    res_owner = client.get(
        f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {user1_token}"}
    )
    assert res_owner.status_code == 200
    assert res_owner.json()["username"] == "user1"

    # 3. Récupérer par un autre utilisateur (échec 403)
    res_other = client.get(
        f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {user2_token}"}
    )
    assert res_other.status_code == 403

    # 4. Récupérer par l'administrateur (succès)
    res_admin = client.get(
        f"/api/v1/orders/{order_id}", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_admin.status_code == 200
    assert res_admin.json()["username"] == "user1"


@patch("requests.get")
def test_get_all_orders_forbidden_for_user(mock_get):
    token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/orders", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Permissions insuffisantes"


@patch("requests.get")
def test_get_all_orders_admin_success(mock_get):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 5,
    }
    mock_get.return_value = mock_response

    user_token = generate_test_token("user3", "user")
    client.post(
        "/api/v1/orders",
        json={
            "order_number": "GZ-TEST-5",
            "product_id": 1,
            "quantity": 1,
            "total_price": 1000.0,
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )

    admin_token = generate_test_token("admin", "admin")
    response = client.get(
        "/api/v1/orders", headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert any(o["order_number"] == "GZ-TEST-5" for o in response.json())


def test_create_stripe_checkout_not_configured():
    token = generate_test_token("buyer1", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "items": [{"product_id": 1, "name": "Laptop", "price": 1000.0, "quantity": 1}],
        "shipping_address": "123 rue Test",
    }
    response = client.post(
        "/api/v1/orders/stripe/checkout", json=payload, headers=headers
    )
    assert response.status_code == 503
    assert response.json()["detail"] == "Stripe non configuré"


@patch("requests.get")
@patch("app.main.stripe.checkout.Session.create")
def test_create_stripe_checkout_success(mock_create, mock_get, monkeypatch):
    monkeypatch.setattr("app.main.STRIPE_SECRET_KEY", "sk_test_123")
    mock_session = MagicMock()
    mock_session.id = "cs_test_123"
    mock_session.url = "https://checkout.stripe.com/pay/cs_test_123"
    mock_create.return_value = mock_session

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 5,
    }
    mock_get.return_value = mock_response

    token = generate_test_token("buyer2", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "items": [{"product_id": 1, "name": "Laptop", "price": 1000.0, "quantity": 1}],
        "shipping_address": "123 rue Test",
    }
    response = client.post(
        "/api/v1/orders/stripe/checkout", json=payload, headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "cs_test_123"
    assert data["session_url"].startswith("https://checkout.stripe.com")
    assert data["order_number"].startswith("GZ-")


@patch("requests.get")
@patch("app.main.stripe.checkout.Session.create")
def test_create_stripe_checkout_ignores_tampered_price(mock_create, mock_get, monkeypatch):
    # Client claims price=1.0 for a product that really costs 1000.0 — the
    # amount actually sent to Stripe must come from product-service instead.
    monkeypatch.setattr("app.main.STRIPE_SECRET_KEY", "sk_test_123")
    mock_session = MagicMock()
    mock_session.id = "cs_test_tamper"
    mock_session.url = "https://checkout.stripe.com/pay/cs_test_tamper"
    mock_create.return_value = mock_session

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 1,
        "name": "Laptop",
        "price": 1000.0,
        "stock": 5,
    }
    mock_get.return_value = mock_response

    token = generate_test_token("attacker", "user")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "items": [{"product_id": 1, "name": "Laptop", "price": 1.0, "quantity": 1}],
        "shipping_address": "123 rue Test",
    }
    response = client.post(
        "/api/v1/orders/stripe/checkout", json=payload, headers=headers
    )
    assert response.status_code == 200

    line_items = mock_create.call_args.kwargs["line_items"]
    assert line_items[0]["price_data"]["unit_amount"] == 1000


def test_verify_stripe_payment_not_configured():
    token = generate_test_token("buyer1", "user")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/orders/stripe/verify/cs_test_x", headers=headers)
    assert response.status_code == 503


@patch("requests.get")
@patch("app.main.stripe.checkout.Session.retrieve")
@patch("app.main.stripe.checkout.Session.create")
def test_verify_stripe_payment_paid_updates_order(
    mock_create, mock_retrieve, mock_get, monkeypatch
):
    monkeypatch.setattr("app.main.STRIPE_SECRET_KEY", "sk_test_123")
    mock_session = MagicMock()
    mock_session.id = "cs_test_456"
    mock_session.url = "https://checkout.stripe.com/pay/cs_test_456"
    mock_create.return_value = mock_session

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 2,
        "name": "Phone",
        "price": 500.0,
        "stock": 10,
    }
    mock_get.return_value = mock_response

    token = generate_test_token("buyer3", "user")
    headers = {"Authorization": f"Bearer {token}"}
    checkout_res = client.post(
        "/api/v1/orders/stripe/checkout",
        json={
            "items": [{"product_id": 2, "name": "Phone", "price": 500.0, "quantity": 1}],
            "shipping_address": "1 rue Test",
        },
        headers=headers,
    )
    order_number = checkout_res.json()["order_number"]

    mock_retrieve.return_value = MagicMock(
        payment_status="paid", metadata={"order_number": order_number}
    )

    response = client.get("/api/v1/orders/stripe/verify/cs_test_456", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"paid": True, "order_number": order_number}


@patch("app.main.stripe.Webhook.construct_event")
def test_stripe_webhook_invalid_signature(mock_construct):
    mock_construct.side_effect = ValueError("bad signature")
    response = client.post(
        "/api/v1/orders/stripe/webhook",
        content=b"{}",
        headers={"stripe-signature": "invalid"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Signature invalide"


def test_get_order_by_id_uses_redis_cache(monkeypatch):
    fake_redis = MagicMock()
    fake_redis.get.return_value = json.dumps(
        {
            "id": 42,
            "order_number": "GZ-CACHED",
            "username": "cacheduser",
            "product_id": 1,
            "quantity": 1,
            "items_json": None,
            "total_price": 100.0,
            "payment_method": "cod",
            "shipping_address": None,
            "status": "pending",
            "created_at": "2024-01-01T00:00:00",
        }
    )
    monkeypatch.setattr("app.main.redis_client", fake_redis)

    token = generate_test_token("cacheduser", "user")
    response = client.get(
        "/api/v1/orders/42", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["order_number"] == "GZ-CACHED"
