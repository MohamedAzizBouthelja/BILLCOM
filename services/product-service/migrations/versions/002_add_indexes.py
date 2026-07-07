"""add performance indexes

Revision ID: 002
Revises: 001
Create Date: 2026-07-01
"""

from typing import Sequence, Union
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.exc import NoSuchTableError

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_indexes(table: str) -> set:
    bind = op.get_bind()
    try:
        return {idx["name"] for idx in inspect(bind).get_indexes(table)}
    except NoSuchTableError:
        # Table tout juste créée dans la même migration "upgrade head" :
        # pas encore visible en réflexion, donc pas d'index existants.
        return set()


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    # --- Table products ---
    # Base neuve : la migration 001 ne crée pas les tables (elle est vide),
    # c'est Base.metadata.create_all() qui s'en charge juste après les
    # migrations. Le modèle déclare déjà ces mêmes index (models.py), donc
    # rien à faire ici tant que la table n'existe pas encore.
    if inspector.has_table("products"):
        existing = _existing_indexes("products")

        if "ix_products_category" not in existing:
            op.create_index("ix_products_category", "products", ["category"])
        if "ix_products_badge" not in existing:
            op.create_index("ix_products_badge", "products", ["badge"])
        if "ix_products_price" not in existing:
            op.create_index("ix_products_price", "products", ["price"])
        if "ix_products_rating" not in existing:
            op.create_index("ix_products_rating", "products", ["rating"])
        if "ix_products_stock" not in existing:
            op.create_index("ix_products_stock", "products", ["stock"])
        if "ix_products_featured" not in existing:
            op.create_index("ix_products_featured", "products", ["featured"])
        if "ix_products_cat_price" not in existing:
            op.create_index("ix_products_cat_price", "products", ["category", "price"])
        if "ix_products_feat_rat" not in existing:
            op.create_index("ix_products_feat_rat", "products", ["featured", "rating"])
        if "ix_products_cat_badge" not in existing:
            op.create_index("ix_products_cat_badge", "products", ["category", "badge"])

    # --- Table reviews ---
    if inspector.has_table("reviews"):
        existing = _existing_indexes("reviews")

        if "ix_reviews_product_id" not in existing:
            op.create_index("ix_reviews_product_id", "reviews", ["product_id"])
        if "ix_reviews_username" not in existing:
            op.create_index("ix_reviews_username", "reviews", ["username"])
        if "ix_reviews_prod_user" not in existing:
            op.create_index(
                "ix_reviews_prod_user", "reviews", ["product_id", "username"]
            )


def downgrade() -> None:
    op.drop_index("ix_reviews_prod_user", table_name="reviews")
    op.drop_index("ix_reviews_username", table_name="reviews")
    op.drop_index("ix_reviews_product_id", table_name="reviews")
    op.drop_index("ix_products_cat_badge", table_name="products")
    op.drop_index("ix_products_feat_rat", table_name="products")
    op.drop_index("ix_products_cat_price", table_name="products")
    op.drop_index("ix_products_featured", table_name="products")
    op.drop_index("ix_products_stock", table_name="products")
    op.drop_index("ix_products_rating", table_name="products")
    op.drop_index("ix_products_price", table_name="products")
    op.drop_index("ix_products_badge", table_name="products")
    op.drop_index("ix_products_category", table_name="products")
