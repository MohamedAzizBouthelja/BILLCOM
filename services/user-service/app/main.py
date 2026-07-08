import logging
import redis
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter
from pythonjsonlogger import jsonlogger

from app.config import (
    PORT,
    HOST,
    REDIS_HOST,
    REDIS_PORT,
    LOGIN_MAX_ATTEMPTS,
    LOGIN_LOCKOUT_SECONDS,
)
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
auth_login_lockout = Counter(
    "auth_login_lockout_total",
    "Login attempts rejected because the account is locked out",
)

# Configuration des logs structurés en JSON
log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    "%(asctime)s %(levelname)s %(name)s %(message)s %(event)s %(username)s"
)
log_handler.setFormatter(formatter)
logger = logging.getLogger("user-service")
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

# Initialisation de la base de données (création automatique des tables)
Base.metadata.create_all(bind=engine)

# Connexion Redis — compteur de tentatives de connexion échouées (lockout).
# Fail-open : si Redis est indisponible, le lockout est désactivé mais le
# login continue de fonctionner (le rate limiting Nginx reste la protection
# de base contre le brute-force dans ce cas).
try:
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=0,
        decode_responses=True,
        socket_connect_timeout=2,
    )
    redis_client.ping()
    logger.info("Connexion à Redis établie avec succès")
except Exception as e:
    redis_client = None
    logger.warning(
        "Connexion à Redis échouée: %s. Le lockout de compte sera désactivé.", e
    )


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


def _lockout_key(username: str) -> str:
    return f"login_lockout:{username}"


@app.post("/api/v1/users/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    logger.info(f"Tentative de connexion pour l'utilisateur: {login_data.username}")

    lockout_key = _lockout_key(login_data.username)

    # Vérifie le verrouillage AVANT de toucher la base ou de vérifier le mot de
    # passe : un compte verrouillé ne doit pas coûter une requête DB / bcrypt.
    if redis_client:
        try:
            attempts = redis_client.get(lockout_key)
        except Exception as e:
            attempts = None
            logger.warning("Lecture Redis échouée (lockout ignoré): %s", e)
        if attempts and int(attempts) >= LOGIN_MAX_ATTEMPTS:
            ttl = redis_client.ttl(lockout_key)
            auth_login_lockout.inc()
            logger.warning(
                "Compte verrouillé après trop d'échecs de connexion",
                extra={"event": "AUTH_LOCKOUT", "username": login_data.username},
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Compte temporairement verrouillé suite à trop de tentatives "
                    "échouées. Réessayez plus tard."
                ),
                headers={"Retry-After": str(max(ttl, 1))},
            )

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
            "Échec de la connexion pour l'utilisateur: %s",
            login_data.username,
            extra={"event": "AUTH_FAILURE", "username": login_data.username},
        )
        if redis_client:
            try:
                remaining_attempts = redis_client.incr(lockout_key)
                if remaining_attempts == 1:
                    redis_client.expire(lockout_key, LOGIN_LOCKOUT_SECONDS)
            except Exception as e:
                logger.warning("Écriture Redis échouée (lockout ignoré): %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nom d'utilisateur ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if redis_client:
        try:
            redis_client.delete(lockout_key)
        except Exception as e:
            logger.warning("Suppression du compteur Redis échouée: %s", e)

    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    auth_login_success.labels(role=user.role).inc()
    logger.info(
        "Connexion réussie pour l'utilisateur: %s (Rôle: %s)",
        user.username,
        user.role,
        extra={"event": "AUTH_SUCCESS", "username": user.username},
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",  # nosec B105 - pas un mot de passe
    }


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
