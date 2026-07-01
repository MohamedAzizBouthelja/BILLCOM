"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-07-01

Les tables sont créées par Base.metadata.create_all() au démarrage du service.
Cette migration établit uniquement la ligne de base pour Alembic.
"""
from typing import Sequence, Union

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tables déjà gérées par SQLAlchemy create_all() au démarrage.
    pass


def downgrade() -> None:
    pass
