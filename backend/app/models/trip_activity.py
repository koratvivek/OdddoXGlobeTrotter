from datetime import date, time
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TripActivity(Base):
  __tablename__ = "trip_activities"

  id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
  stop_id: Mapped[int] = mapped_column(ForeignKey("stops.id"), index=True, nullable=False)
  activity_id: Mapped[int] = mapped_column(ForeignKey("activities.id"), nullable=False)
  scheduled_date: Mapped[date] = mapped_column(Date, nullable=False)
  scheduled_time: Mapped[time | None] = mapped_column(Time, nullable=True)
  cost_override: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

  stop = relationship("Stop", back_populates="trip_activities")
  activity = relationship("Activity", back_populates="trip_activities")
