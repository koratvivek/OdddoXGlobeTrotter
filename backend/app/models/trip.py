from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Trip(Base):
  __tablename__ = "trips"

  id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
  user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
  name: Mapped[str] = mapped_column(String(255), nullable=False)
  start_date: Mapped[date] = mapped_column(Date, nullable=False)
  end_date: Mapped[date] = mapped_column(Date, nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  cover_photo: Mapped[str | None] = mapped_column(String(512), nullable=True)
  is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
  budget_cap: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
  created_at: Mapped[datetime] = mapped_column(
    DateTime(timezone=True), server_default=func.now(), nullable=False
  )

  user = relationship("User", back_populates="trips")
  stops = relationship("Stop", back_populates="trip", cascade="all, delete-orphan")
  shares = relationship("TripShare", back_populates="trip", cascade="all, delete-orphan")
