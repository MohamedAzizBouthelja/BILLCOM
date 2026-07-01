import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
import sys

# Ajouter le dossier parent au path pour importer app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import Base, get_db
from app.main import app
from app.models import User

# Configuration de la base de données de test SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_user.db"
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

@pytest.fixture(autouse=True)
def run_before_and_after_tests():
    # Vider la base de données de test avant chaque test
    db = TestingSessionLocal()
    db.query(User).delete()
    db.commit()
    db.close()
    yield

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy", "service": "user-service"}

def test_register_user():
    payload = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "password123",
        "role": "user"
    }
    response = client.post("/api/v1/users/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "testuser@example.com"
    assert data["role"] == "user"
    assert "id" in data

def test_register_duplicate_username():
    payload = {
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "password123",
        "role": "user"
    }
    client.post("/api/v1/users/register", json=payload)
    
    payload_dup = {
        "username": "testuser",
        "email": "testuser2@example.com",
        "password": "password123",
        "role": "user"
    }
    response = client.post("/api/v1/users/register", json=payload_dup)
    assert response.status_code == 400
    assert response.json()["detail"] == "Nom d'utilisateur déjà pris"

def test_login_and_get_me():
    # 1. Enregistrer un utilisateur
    register_payload = {
        "username": "me_user",
        "email": "me@example.com",
        "password": "password123",
        "role": "user"
    }
    client.post("/api/v1/users/register", json=register_payload)

    # 2. Login
    login_payload = {
        "username": "me_user",
        "password": "password123"
    }
    login_response = client.post("/api/v1/users/login", json=login_payload)
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert token_data["token_type"] == "bearer"
    token = token_data["access_token"]

    # 3. Accès /me avec token
    headers = {"Authorization": f"Bearer {token}"}
    me_response = client.get("/api/v1/users/me", headers=headers)
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["username"] == "me_user"
    assert me_data["email"] == "me@example.com"
    assert me_data["role"] == "user"

def test_admin_rbac_permissions():
    # 1. Créer un utilisateur standard
    client.post("/api/v1/users/register", json={
        "username": "standard",
        "email": "std@example.com",
        "password": "password123",
        "role": "user"
    })
    
    # 2. Créer un administrateur
    client.post("/api/v1/users/register", json={
        "username": "administrator",
        "email": "admin@example.com",
        "password": "password123",
        "role": "admin"
    })

    # 3. Login standard
    std_login = client.post("/api/v1/users/login", json={"username": "standard", "password": "password123"}).json()
    std_token = std_login["access_token"]

    # 4. Login admin
    adm_login = client.post("/api/v1/users/login", json={"username": "administrator", "password": "password123"}).json()
    adm_token = adm_login["access_token"]

    # 5. Tentative d'accès à la liste par l'utilisateur standard (doit échouer - 403)
    response_std = client.get("/api/v1/users", headers={"Authorization": f"Bearer {std_token}"})
    assert response_std.status_code == 403

    # 6. Accès à la liste par l'administrateur (doit réussir)
    response_adm = client.get("/api/v1/users", headers={"Authorization": f"Bearer {adm_token}"})
    assert response_adm.status_code == 200
    users_list = response_adm.json()
    assert len(users_list) == 2
