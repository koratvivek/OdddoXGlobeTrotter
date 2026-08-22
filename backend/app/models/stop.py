from datetime import date

from sqlalchemy import Date, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Stop(Base):
  __tablename__ = "stops"

  id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
  trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id"), index=True, nullable=False)
  city_id: Mapped[int] = mapped_column(ForeignKey("cities.id"), index=True, nullable=False)
  start_date: Mapped[date] = mapped_column(Date, nullable=False)
  end_date: Mapped[date] = mapped_column(Date, nullable=False)
  order_index: Mapped[int] = mapped_column(Integer, nullable=False)

  trip = relationship("Trip", back_populates="stops")
  city = relationship("City", back_populates="stops")
  trip_activities = relationship(
    "TripActivity", back_populates="stop", cascade="all, delete-orphan"
  )
