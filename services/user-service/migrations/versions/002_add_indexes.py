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
    if not inspect(bind).has_table("users"):
        # Base neuve : la migration 001 ne crée pas les tables (elle est
        # vide), c'est Base.metadata.create_all() qui s'en charge juste après
        # les migrations. Le modèle déclare déjà ces mêmes index (models.py),
        # donc rien à faire ici tant que la table n'existe pas encore.
        return

    existing = _existing_indexes("users")

    if "ix_users_role" not in existing:
        op.create_index("ix_users_role", "users", ["role"])
    if "ix_users_created_at" not in existing:
        op.create_index("ix_users_created_at", "users", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_users_created_at", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
