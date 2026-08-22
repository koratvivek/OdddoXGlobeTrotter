from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ShareLike(Base):
    __tablename__ = "share_likes"
    __table_args__ = (UniqueConstraint("share_id", "user_id", name="uq_share_likes_share_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    share_id: Mapped[int] = mapped_column(
        ForeignKey("trip_shares.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    share = relationship("TripShare", back_populates="likes")
    user = relationship("User")
