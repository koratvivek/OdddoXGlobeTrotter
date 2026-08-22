"""merge multiple heads

Revision ID: 61f71b9f666e
Revises: 003_add_share_likes, 0a298982252e
Create Date: 2026-08-22 15:09:49.272439

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '61f71b9f666e'
down_revision: Union[str, None] = ('003_add_share_likes', '0a298982252e')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
