import logging
import jwt
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter
from pythonjsonlogger import jsonlogger
from typing import Optional

from app.config import PORT, HOST, JWT_SECRET, JWT_ALGORITHM
from app.database import engine, Base, get_db, SessionLocal
from app.models import Product, Review
from app.schemas import (
    ProductCreate,
    ProductResponse,
    ProductListResponse,
    ReviewCreate,
    ReviewResponse,
)
from app.seed_data import DEFAULT_PRODUCTS

log_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s")
log_handler.setFormatter(formatter)
logger = logging.getLogger("product-service")
logger.addHandler(log_handler)
logger.setLevel(logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Product Service",
    description="Microservice pour la gestion du catalogue des produits",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")

product_views = Counter(
    "product_views_total",
    "Product detail page views",
    ["product_id", "category"],
)

security_agent = HTTPBearer()


@app.on_event("startup")
def seed_default_products():
    db = SessionLocal()
    try:
        existing_slugs = {
            row[0]
            for row in db.query(Product.slug)
            .filter(Product.slug.in_([p["slug"] for p in DEFAULT_PRODUCTS]))
            .all()
        }

        missing = [
            Product(**p) for p in DEFAULT_PRODUCTS if p["slug"] not in existing_slugs
        ]

        if missing:
            db.add_all(missing)
            db.commit()
            logger.info("Seed produits terminé: %s produits insérés", len(missing))
    finally:
        db.close()


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security_agent),
) -> dict:
    return decode_access_token(credentials.credentials)


def require_role(required_role: str):
    def dependency(payload: dict = Depends(get_current_user_payload)) -> dict:
        if payload.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissions insuffisantes",
            )
        return payload

    return dependency


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "product-service"}


@app.get("/api/v1/products", response_model=ProductListResponse)
def get_products(
    q: Optional[str] = Query(None, description="Recherche par nom ou description"),
    category: Optional[str] = Query(None, description="Filtrer par catégorie"),
    min_price: Optional[float] = Query(None, ge=0, description="Prix minimum"),
    max_price: Optional[float] = Query(None, ge=0, description="Prix maximum"),
    badge: Optional[str] = Query(None, description="Filtrer par badge: NEW, HOT, SALE"),
    in_stock: Optional[bool] = Query(
        None, description="Seulement les produits en stock"
    ),
    featured: Optional[bool] = Query(
        None, description="Seulement les produits vedettes"
    ),
    sort: str = Query(
        "newest", description="Tri: newest, price_asc, price_desc, rating, popular"
    ),
    page: int = Query(1, ge=1, description="Numéro de page"),
    per_page: int = Query(12, ge=1, le=100, description="Produits par page"),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if q:
        term = f"%{q.lower()}%"
        query = query.filter(
            func.lower(Product.name).like(term)
            | func.lower(Product.description).like(term)
        )
    if category:
        query = query.filter(Product.category == category)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if badge:
        query = query.filter(Product.badge == badge.upper())
    if in_stock is True:
        query = query.filter(Product.stock > 0)
    if featured is not None:
        query = query.filter(Product.featured == featured)

    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating.desc())
    elif sort == "popular":
        query = query.order_by(Product.reviews.desc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    total_pages = max(1, (total + per_page - 1) // per_page)
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@app.get("/api/v1/products/slug/{slug}", response_model=ProductResponse)
def get_product_by_slug(slug: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    product_views.labels(
        product_id=str(product.id), category=product.category or "unknown"
    ).inc()
    return product


@app.get("/api/v1/products/{product_id}", response_model=ProductResponse)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    product_views.labels(
        product_id=str(product_id), category=product.category or "unknown"
    ).inc()
    return product


@app.post(
    "/api/v1/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(require_role("admin")),
):
    if db.query(Product).filter(Product.name == product_data.name).first():
        raise HTTPException(
            status_code=400, detail="Un produit avec ce nom existe déjà"
        )

    new_product = Product(**product_data.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    logger.info("Produit créé: %s (ID: %s)", new_product.name, new_product.id)
    return new_product


# ── Reviews ────────────────────────────────────────────────────────────────


@app.get("/api/v1/products/{product_id}/reviews", response_model=list[ReviewResponse])
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    return (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )


@app.post(
    "/api/v1/products/{product_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    product_id: int,
    review_data: ReviewCreate,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    sub = str(payload.get("user_id") or payload.get("sub") or "")
    username = payload.get("username") or sub or "Utilisateur"
    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        user_id = abs(hash(sub)) % (10**9)

    if (
        db.query(Review)
        .filter(Review.product_id == product_id, Review.username == username)
        .first()
    ):
        raise HTTPException(status_code=400, detail="Vous avez déjà noté ce produit")

    review = Review(
        product_id=product_id,
        user_id=user_id,
        username=username,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(review)
    db.flush()

    all_ratings = db.query(Review.rating).filter(Review.product_id == product_id).all()
    product.rating = round(sum(r[0] for r in all_ratings) / len(all_ratings), 1)
    product.reviews = len(all_ratings)

    db.commit()
    db.refresh(review)
    logger.info(
        "Review créé: produit=%s note=%s user=%s",
        product_id,
        review_data.rating,
        username,
    )
    return review


@app.delete(
    "/api/v1/products/{product_id}/reviews/{review_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_review(
    product_id: int,
    review_id: int,
    db: Session = Depends(get_db),
    payload: dict = Depends(get_current_user_payload),
):
    review = (
        db.query(Review)
        .filter(Review.id == review_id, Review.product_id == product_id)
        .first()
    )
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")

    sub = str(payload.get("user_id") or payload.get("sub") or "")
    role = payload.get("role", "")
    try:
        user_id = int(sub)
    except (ValueError, TypeError):
        user_id = abs(hash(sub)) % (10**9)
    if review.user_id != user_id and role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Non autorisé")

    db.delete(review)
    db.flush()

    remaining = db.query(Review.rating).filter(Review.product_id == product_id).all()
    product = db.query(Product).filter(Product.id == product_id).first()
    if remaining:
        product.rating = round(sum(r[0] for r in remaining) / len(remaining), 1)
        product.reviews = len(remaining)
    else:
        product.rating = 0.0
        product.reviews = 0

    db.commit()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
