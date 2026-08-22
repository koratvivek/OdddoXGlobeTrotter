from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Activity(Base):
  __tablename__ = "activities"

  id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
  city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"), index=True, nullable=False)
  name: Mapped[str] = mapped_column(String(255), nullable=False)
  category: Mapped[str] = mapped_column(String(100), nullable=False)
  cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
  duration: Mapped[int] = mapped_column(nullable=False)
  description: Mapped[str | None] = mapped_column(Text, nullable=True)
  image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

  city = relationship("City", back_populates="activities")
  trip_activities = relationship("TripActivity", back_populates="activity")
