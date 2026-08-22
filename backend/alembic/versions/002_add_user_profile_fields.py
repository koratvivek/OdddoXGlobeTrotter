"""Add extended user profile fields."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002_add_user_profile_fields"
down_revision: Union[str, None] = "652dc7509b3d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("first_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))

    op.execute(
        """
        UPDATE users
        SET first_name = COALESCE(NULLIF(split_part(name, ' ', 1), ''), name),
            last_name = COALESCE(
                NULLIF(substring(name from position(' ' in name) + 1), ''),
                'User'
            )
        """
    )

    op.alter_column("users", "first_name", nullable=False)
    op.alter_column("users", "last_name", nullable=False)


def downgrade() -> None:
    op.drop_column("users", "bio")
    op.drop_column("users", "country")
    op.drop_column("users", "city")
    op.drop_column("users", "phone")
    op.drop_column("users", "last_name")
    op.drop_column("users", "first_name")
