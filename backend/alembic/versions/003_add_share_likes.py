"""Add share_likes table."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_add_share_likes"
down_revision: Union[str, None] = "002_add_user_profile_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "share_likes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("share_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["share_id"], ["trip_shares.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("share_id", "user_id", name="uq_share_likes_share_user"),
    )
    op.create_index(op.f("ix_share_likes_share_id"), "share_likes", ["share_id"], unique=False)
    op.create_index(op.f("ix_share_likes_user_id"), "share_likes", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_share_likes_user_id"), table_name="share_likes")
    op.drop_index(op.f("ix_share_likes_share_id"), table_name="share_likes")
    op.drop_table("share_likes")
