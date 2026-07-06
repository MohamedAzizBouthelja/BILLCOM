import os
from dotenv import load_dotenv

# Charger les variables du fichier .env s'il existe
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+pymysql://root:bymabpudg30@localhost:3306/product_db"
)
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkeychangeit")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
PORT = int(os.getenv("PORT", "8002"))
HOST = os.getenv("HOST", "0.0.0.0")
