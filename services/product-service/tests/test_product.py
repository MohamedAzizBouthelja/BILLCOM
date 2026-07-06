import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import jwt
from datetime import datetime, timedelta, timezone
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import Base, get_db
from app.main import app
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
        response.status_code == 401
    )  # HTTPBearer retourne 401 si le token est manquant


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
    assert response.status_code == 401


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
