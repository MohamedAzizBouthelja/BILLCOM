from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    name          = Column(String(100), unique=True, nullable=False)
    slug          = Column(String(120), unique=True, nullable=False)
    description   = Column(String(500), nullable=True)
    price         = Column(Float, nullable=False)
    old_price     = Column(Float, nullable=True)
    stock         = Column(Integer, default=0, nullable=False)
    image_url     = Column(String(500), nullable=True)
    badge         = Column(String(20), nullable=True, default="")
    rating        = Column(Float, nullable=True, default=0.0)
    reviews       = Column(Integer, nullable=True, default=0)
    featured      = Column(Boolean, default=False, nullable=False)
    category      = Column(String(50), nullable=True)
    category_name = Column(String(50), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        # Index simples pour les filtres API
        Index("ix_products_category",  "category"),
        Index("ix_products_badge",     "badge"),
        Index("ix_products_price",     "price"),
        Index("ix_products_rating",    "rating"),
        Index("ix_products_stock",     "stock"),
        Index("ix_products_featured",  "featured"),
        # Index composites pour les requêtes combinées fréquentes
        Index("ix_products_cat_price", "category", "price"),     # ?category=&min_price=&max_price=
        Index("ix_products_feat_rat",  "featured", "rating"),    # ?featured=true&sort=rating
        Index("ix_products_cat_badge", "category", "badge"),     # ?category=&badge=
    )


class Review(Base):
    __tablename__ = "reviews"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, nullable=False)
    username   = Column(String(100), nullable=False)
    rating     = Column(Float, nullable=False)
    comment    = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_reviews_product_id",       "product_id"),
        Index("ix_reviews_username",         "username"),
        # Composite : accélère le check d'unicité par (product, username)
        Index("ix_reviews_prod_user", "product_id", "username"),
    )
