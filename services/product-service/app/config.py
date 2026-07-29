import os
from dotenv import load_dotenv

# Charger les variables du fichier .env s'il existe
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://root:bymabpudg30@localhost:3306/product_db"
)
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkeychangeit")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# Shared secret for service-to-service calls (order-service -> product-service
# stock adjustment) — not a customer JWT, just proves the caller is another
# internal service rather than an arbitrary client.
INTERNAL_SERVICE_KEY = os.getenv(
    "INTERNAL_SERVICE_KEY", "devlocal-internal-key-changeit"
)
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
PORT = int(os.getenv("PORT", "8002"))
HOST = os.getenv(
    "HOST", "0.0.0.0"
)  # nosec B104 - doit bind toutes interfaces dans le conteneur Docker
