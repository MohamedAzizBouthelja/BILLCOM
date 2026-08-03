import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import jwt
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import Base, get_db
from app.main import (
    app,
    _apply_stock_decrement,
    _process_stock_event,
    ProductNotFoundError,
    InsufficientStockError,
    STOCK_DLQ_STREAM,
)
from app.models import Product, Review
from app.config import JWT_SECRET, JWT_ALGORITHM

# Configuration de la base de données de test SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_product.db"
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
    db.query(Review).delete()
    db.query(Product).delete()
    db.commit()
    db.close()
    yield


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "product-service"}


def test_get_products_empty():
    response = client.get("/api/v1/products")
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0


def test_create_product_unauthorized():
    payload = {
        "name": "Laptop",
        "slug": "laptop",
        "description": "Powerful laptop",
        "price": 1200.0,
        "stock": 10,
    }
    # Sans token
    response = client.post("/api/v1/products", json=payload)
    assert (
        response.status_code == 403
    )  # HTTPBearer retourne 403 (pas 401) si le header Authorization est absent


def test_create_product_forbidden_for_user():
    payload = {
        "name": "Laptop",
        "slug": "laptop",
        "description": "Powerful laptop",
        "price": 1200.0,
        "stock": 10,
    }
    user_token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {user_token}"}

    response = client.post("/api/v1/products", json=payload, headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Permissions insuffisantes"


def test_create_product_success_for_admin():
    payload = {
        "name": "Laptop",
        "slug": "laptop",
        "description": "Powerful laptop",
        "price": 1200.0,
        "stock": 10,
    }
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.post("/api/v1/products", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Laptop"
    assert data["price"] == 1200.0
    assert data["stock"] == 10
    assert "id" in data


def test_get_product_by_id():
    # 1. Créer un produit
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": "Smartphone", "slug": "smartphone", "price": 800.0, "stock": 25}
    create_res = client.post("/api/v1/products", json=payload, headers=headers)
    product_id = create_res.json()["id"]

    # 2. Récupérer le produit (GET public, sans token nécessaire)
    get_res = client.get(f"/api/v1/products/{product_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Smartphone"
    assert get_res.json()["price"] == 800.0


def test_get_product_not_found():
    response = client.get("/api/v1/products/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Produit non trouvé"


def test_create_product_duplicate_name():
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": "Tablet", "slug": "tablet", "price": 300.0, "stock": 15}

    # Premier ajout
    client.post("/api/v1/products", json=payload, headers=headers)
    # Deuxième ajout avec le même nom
    response = client.post("/api/v1/products", json=payload, headers=headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Un produit avec ce nom existe déjà"


def test_create_product_success_for_super_admin():
    payload = {"name": "Router", "slug": "router", "price": 60.0, "stock": 20}
    super_admin_token = generate_test_token("superadmin", "super_admin")
    headers = {"Authorization": f"Bearer {super_admin_token}"}

    response = client.post("/api/v1/products", json=payload, headers=headers)
    assert response.status_code == 201


def test_update_product_success_for_admin():
    product_id = _create_product("Keyboard", "keyboard")
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.patch(
        f"/api/v1/products/{product_id}",
        json={"price": 999.0, "stock": 50},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["price"] == 999.0
    assert data["stock"] == 50
    assert data["name"] == "Keyboard"


def test_update_product_not_found():
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.patch(
        "/api/v1/products/999", json={"price": 10.0}, headers=headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Produit non trouvé"


def test_update_product_forbidden_for_user():
    product_id = _create_product("Mouse", "mouse")
    user_token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {user_token}"}

    response = client.patch(
        f"/api/v1/products/{product_id}", json={"price": 10.0}, headers=headers
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Permissions insuffisantes"


def test_update_product_unauthorized():
    product_id = _create_product("Webcam", "webcam")
    response = client.patch(f"/api/v1/products/{product_id}", json={"price": 10.0})
    assert response.status_code == 403


def test_update_product_duplicate_name_rejected():
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}
    _create_product("Speaker A", "speaker-a")
    product_b_id = _create_product("Speaker B", "speaker-b")

    response = client.patch(
        f"/api/v1/products/{product_b_id}",
        json={"name": "Speaker A"},
        headers=headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Un produit avec ce nom existe déjà"


def test_update_product_same_name_allowed():
    product_id = _create_product("Headset", "headset")
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.patch(
        f"/api/v1/products/{product_id}",
        json={"name": "Headset", "stock": 3},
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json()["stock"] == 3


def test_update_product_validation_failure():
    product_id = _create_product("Charger", "charger")
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.patch(
        f"/api/v1/products/{product_id}", json={"price": -5}, headers=headers
    )
    assert response.status_code == 422


def test_delete_product_success_for_admin():
    product_id = _create_product("Printer", "printer")
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.delete(f"/api/v1/products/{product_id}", headers=headers)
    assert response.status_code == 204

    get_response = client.get(f"/api/v1/products/{product_id}")
    assert get_response.status_code == 404


def test_delete_product_not_found():
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    response = client.delete("/api/v1/products/999", headers=headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Produit non trouvé"


def test_delete_product_forbidden_for_user():
    product_id = _create_product("Scanner", "scanner")
    user_token = generate_test_token("testuser", "user")
    headers = {"Authorization": f"Bearer {user_token}"}

    response = client.delete(f"/api/v1/products/{product_id}", headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Permissions insuffisantes"


def test_delete_product_unauthorized():
    product_id = _create_product("Projector", "projector")
    response = client.delete(f"/api/v1/products/{product_id}")
    assert response.status_code == 403


def _create_product(name="Monitor", slug="monitor"):
    admin_token = generate_test_token("adminuser", "admin")
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {"name": name, "slug": slug, "price": 500.0, "stock": 5}
    res = client.post("/api/v1/products", json=payload, headers=headers)
    return res.json()["id"]


def test_get_reviews_product_not_found():
    response = client.get("/api/v1/products/999/reviews")
    assert response.status_code == 404
    assert response.json()["detail"] == "Produit non trouvé"


def test_get_reviews_empty():
    product_id = _create_product()
    response = client.get(f"/api/v1/products/{product_id}/reviews")
    assert response.status_code == 200
    assert response.json() == []


def test_create_review_unauthorized():
    product_id = _create_product()
    response = client.post(
        f"/api/v1/products/{product_id}/reviews", json={"rating": 4.0}
    )
    assert response.status_code == 403  # HTTPBearer: pas de header Authorization


def test_create_review_product_not_found():
    token = generate_test_token("reviewer1", "user")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/v1/products/999/reviews", json={"rating": 4.0}, headers=headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Produit non trouvé"


def test_create_review_success_updates_product_rating():
    product_id = _create_product()
    token = generate_test_token("reviewer1", "user")
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        f"/api/v1/products/{product_id}/reviews",
        json={"rating": 5.0, "comment": "Excellent"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["rating"] == 5.0
    assert data["username"] == "reviewer1"
    assert data["comment"] == "Excellent"

    product = client.get(f"/api/v1/products/{product_id}").json()
    assert product["rating"] == 5.0
    assert product["reviews"] == 1


def test_create_review_duplicate_rejected():
    product_id = _create_product()
    token = generate_test_token("reviewer2", "user")
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        f"/api/v1/products/{product_id}/reviews",
        json={"rating": 3.0},
        headers=headers,
    )
    response = client.post(
        f"/api/v1/products/{product_id}/reviews",
        json={"rating": 4.0},
        headers=headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Vous avez déjà noté ce produit"


def test_delete_review_not_found():
    product_id = _create_product()
    token = generate_test_token("reviewer3", "user")
    headers = {"Authorization": f"Bearer {token}"}
    response = client.delete(
        f"/api/v1/products/{product_id}/reviews/999", headers=headers
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Avis non trouvé"


def test_delete_review_forbidden_for_other_user():
    product_id = _create_product()
    owner_token = generate_test_token("reviewer4", "user")
    other_token = generate_test_token("reviewer5", "user")

    create_res = client.post(
        f"/api/v1/products/{product_id}/reviews",
        json={"rating": 4.0},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    review_id = create_res.json()["id"]

    response = client.delete(
        f"/api/v1/products/{product_id}/reviews/{review_id}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Non autorisé"


def test_decrement_stock_requires_internal_key():
    product_id = _create_product(name="Speaker", slug="speaker")
    response = client.patch(
        f"/api/v1/products/{product_id}/stock", json={"quantity": 1}
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Accès interne uniquement"


def test_decrement_stock_rejects_wrong_key():
    product_id = _create_product(name="Speaker2", slug="speaker2")
    response = client.patch(
        f"/api/v1/products/{product_id}/stock",
        json={"quantity": 1},
        headers={"X-Internal-Service-Key": "wrong-key"},
    )
    assert response.status_code == 403


def test_decrement_stock_success():
    product_id = _create_product(name="Keyboard", slug="keyboard")
    response = client.patch(
        f"/api/v1/products/{product_id}/stock",
        json={"quantity": 2},
        headers={"X-Internal-Service-Key": "devlocal-internal-key-changeit"},
    )
    assert response.status_code == 200
    assert response.json()["stock"] == 3  # _create_product seeds stock=5


def test_decrement_stock_insufficient_stock():
    product_id = _create_product(name="Mouse", slug="mouse")
    response = client.patch(
        f"/api/v1/products/{product_id}/stock",
        json={"quantity": 999},
        headers={"X-Internal-Service-Key": "devlocal-internal-key-changeit"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Stock insuffisant"


def test_decrement_stock_product_not_found():
    response = client.patch(
        "/api/v1/products/999/stock",
        json={"quantity": 1},
        headers={"X-Internal-Service-Key": "devlocal-internal-key-changeit"},
    )
    assert response.status_code == 404


def test_apply_stock_decrement_success():
    product_id = _create_product(name="Webcam", slug="webcam")
    db = TestingSessionLocal()
    try:
        product = _apply_stock_decrement(db, product_id, 2)
        assert product.stock == 3  # _create_product seeds stock=5
    finally:
        db.close()


def test_apply_stock_decrement_insufficient_raises():
    product_id = _create_product(name="Headset", slug="headset")
    db = TestingSessionLocal()
    try:
        with pytest.raises(InsufficientStockError):
            _apply_stock_decrement(db, product_id, 999)
    finally:
        db.close()


def test_apply_stock_decrement_not_found_raises():
    db = TestingSessionLocal()
    try:
        with pytest.raises(ProductNotFoundError):
            _apply_stock_decrement(db, 999, 1)
    finally:
        db.close()


def test_process_stock_event_applies_and_dedupes(monkeypatch):
    product_id = _create_product(name="Charger", slug="charger")
    fake_redis = MagicMock()
    fake_redis.set.side_effect = [True, None]
    monkeypatch.setattr("app.main.redis_client", fake_redis)

    db = TestingSessionLocal()
    try:
        result1 = _process_stock_event(db, "GZ-DEDUP-1", product_id, 2)
        result2 = _process_stock_event(db, "GZ-DEDUP-1", product_id, 2)
    finally:
        db.close()

    assert result1 is True
    assert result2 is True
    product = client.get(f"/api/v1/products/{product_id}").json()
    assert product["stock"] == 3  # décrémenté une seule fois (5 - 2)


def test_process_stock_event_business_failure_sends_to_dlq(monkeypatch):
    product_id = _create_product(name="Cable", slug="cable")
    fake_redis = MagicMock()
    fake_redis.set.return_value = True
    monkeypatch.setattr("app.main.redis_client", fake_redis)

    db = TestingSessionLocal()
    try:
        result = _process_stock_event(db, "GZ-DLQ-1", product_id, 999)
    finally:
        db.close()

    assert result is True
    fake_redis.xadd.assert_called_once()
    call_args = fake_redis.xadd.call_args
    assert call_args.args[0] == STOCK_DLQ_STREAM
    assert call_args.args[1]["product_id"] == str(product_id)


def test_process_stock_event_transient_failure_releases_dedup(monkeypatch):
    fake_redis = MagicMock()
    fake_redis.set.return_value = True
    monkeypatch.setattr("app.main.redis_client", fake_redis)
    monkeypatch.setattr(
        "app.main._apply_stock_decrement",
        MagicMock(side_effect=Exception("db down")),
    )

    db = TestingSessionLocal()
    try:
        result = _process_stock_event(db, "GZ-TRANSIENT-1", 1, 1)
    finally:
        db.close()

    assert result is False
    fake_redis.delete.assert_called_once_with("stockevt:GZ-TRANSIENT-1:1")


def test_delete_review_success_resets_product_rating():
    product_id = _create_product()
    owner_token = generate_test_token("reviewer6", "user")
    headers = {"Authorization": f"Bearer {owner_token}"}

    create_res = client.post(
        f"/api/v1/products/{product_id}/reviews",
        json={"rating": 2.0},
        headers=headers,
    )
    review_id = create_res.json()["id"]

    response = client.delete(
        f"/api/v1/products/{product_id}/reviews/{review_id}", headers=headers
    )
    assert response.status_code == 204

    product = client.get(f"/api/v1/products/{product_id}").json()
    assert product["rating"] == 0.0
    assert product["reviews"] == 0
