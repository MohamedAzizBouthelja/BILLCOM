import os
from dotenv import load_dotenv

# Charger les variables du fichier .env s'il existe
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:bymabpudg30@localhost:3306/order_db")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8002")

JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkeychangeit")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
PORT = int(os.getenv("PORT", "8003"))
HOST = os.getenv("HOST", "0.0.0.0")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://localhost:8443")

