"""add performance indexes

Revision ID: 002
Revises: 001
Create Date: 2026-07-01
"""

from typing import Sequence, Union
from alembic import op
from sqlalchemy import inspect

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _existing_indexes(table: str) -> set:
    bind = op.get_bind()
    return {idx["name"] for idx in inspect(bind).get_indexes(table)}


def upgrade() -> None:
    existing = _existing_indexes("users")

    if "ix_users_role" not in existing:
        op.create_index("ix_users_role", "users", ["role"])
    if "ix_users_created_at" not in existing:
        op.create_index("ix_users_created_at", "users", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_users_created_at", table_name="users")
    op.drop_index("ix_users_role", table_name="users")
