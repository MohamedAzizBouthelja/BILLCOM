import os
from dotenv import load_dotenv

# Charger les variables du fichier .env s'il existe
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://root:bymabpudg30@localhost:3306/user_db"
)
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkeychangeit")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
PORT = int(os.getenv("PORT", "8001"))
HOST = os.getenv(
    "HOST", "0.0.0.0"
)  # nosec B104 - doit bind toutes interfaces dans le conteneur Docker

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))

# Verrouillage de compte après tentatives de connexion échouées répétées
LOGIN_MAX_ATTEMPTS = int(os.getenv("LOGIN_MAX_ATTEMPTS", "5"))
LOGIN_LOCKOUT_SECONDS = int(os.getenv("LOGIN_LOCKOUT_SECONDS", "900"))  # 15 min
