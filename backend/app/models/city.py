from decimal import Decimal

from sqlalchemy import Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class City(Base):
  __tablename__ = "cities"

  id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
  name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
  country: Mapped[str] = mapped_column(String(255), nullable=False)
  cost_index: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
  popularity_score: Mapped[int] = mapped_column(nullable=False, default=0)
  image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

  activities = relationship("Activity", back_populates="city", cascade="all, delete-orphan")
  stops = relationship("Stop", back_populates="city")
