import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter
from pythonjsonlogger import jsonlogger

from app.config import PORT, HOST
from app.database import engine, Base, get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, UserLogin, Token
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)

# Custom business metrics
auth_login_success = Counter(
    "auth_login_success_total",
    "Successful login attempts",
    ["role"],
)
auth_login_failure = Counter(
    "auth_login_failure_total",
    "Failed login attempts",
)
auth_register = Counter(
    "auth_register_total",
    "User registrations",
    ["role"],
)

# Configuration des logs structurés en JSON
log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s")
log_handler.setFormatter(formatter)
logger = logging.getLogger("user-service")
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

# Initialisation de la base de données (création automatique des tables)
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="User Service",
    description="Microservice pour la gestion des utilisateurs, rôles et authentification",  # noqa: E501
    version="1.0.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics integration
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

security_agent = HTTPBearer()


def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security_agent),
) -> dict:
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        logger.warning("Token invalide ou expiré")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_role(required_role: str):
    def dependency(payload: dict = Depends(get_current_user_payload)) -> dict:
        user_role = payload.get("role")
        if user_role != required_role:
            logger.warning(
                f"Accès refusé: Rôle {required_role} requis, Rôle {user_role} fourni"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes pour effectuer cette action",
            )
        return payload

    return dependency


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "user-service"}


@app.post(
    "/api/v1/users/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    logger.info(f"Tentative de création d'utilisateur: {user_data.username}")

    # Vérifier si l'utilisateur existe déjà
    db_user_by_name = db.query(User).filter(User.username == user_data.username).first()
    if db_user_by_name:
        logger.warning(f"Le nom d'utilisateur existe déjà: {user_data.username}")
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")

    db_user_by_email = db.query(User).filter(User.email == user_data.email).first()
    if db_user_by_email:
        logger.warning(f"L'adresse email existe déjà: {user_data.email}")
        raise HTTPException(status_code=400, detail="Email déjà utilisé")

    # Validation du rôle
    role = user_data.role if user_data.role in ["user", "admin"] else "user"

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    auth_register.labels(role=new_user.role).inc()
    logger.info(
        f"Utilisateur créé avec succès: {new_user.username} (Rôle: {new_user.role})"
    )
    return new_user


@app.post("/api/v1/users/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    logger.info(f"Tentative de connexion pour l'utilisateur: {login_data.username}")
    user = (
        db.query(User)
        .filter(
            (User.username == login_data.username) | (User.email == login_data.username)
        )
        .first()
    )
    if not user or not verify_password(login_data.password, user.hashed_password):
        auth_login_failure.inc()
        logger.warning(
            f"Échec de la connexion pour l'utilisateur: {login_data.username}"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nom d'utilisateur ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    auth_login_success.labels(role=user.role).inc()
    logger.info(
        f"Connexion réussie pour l'utilisateur: {user.username} (Rôle: {user.role})"
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/v1/users/me", response_model=UserResponse)
def get_me(
    payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)
):
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user


@app.get("/api/v1/users", response_model=list[UserResponse])
def get_all_users(
    db: Session = Depends(get_db), payload: dict = Depends(require_role("admin"))
):
    logger.info(
        "Administrateur %s demande la liste complète des utilisateurs",
        payload.get("sub"),
    )
    users = db.query(User).all()
    return users


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
