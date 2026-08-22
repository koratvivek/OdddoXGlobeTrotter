from datetime import date, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class TripActivityBase(BaseModel):
    stop_id: int
    activity_id: int
    scheduled_date: date
    scheduled_time: time | None = None
    cost_override: Decimal | None = None


class TripActivityCreate(TripActivityBase):
    pass


class TripActivityUpdate(BaseModel):
    activity_id: int | None = None
    scheduled_date: date | None = None
    scheduled_time: time | None = None
    cost_override: Decimal | None = None


class TripActivityRead(TripActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
