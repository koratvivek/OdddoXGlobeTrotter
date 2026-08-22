from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TripShare(Base):
  __tablename__ = "trip_shares"

  id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
  trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), index=True, nullable=False)
  public_slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
  created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), nullable=False
  )

  trip = relationship("Trip", back_populates="shares")
  likes = relationship("ShareLike", back_populates="share", cascade="all, delete-orphan")
