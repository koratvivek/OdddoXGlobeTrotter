from datetime import date

from pydantic import BaseModel, ConfigDict


class StopBase(BaseModel):
    trip_id: int
    city_id: int
    start_date: date
    end_date: date
    order_index: int


class StopCreate(StopBase):
    pass


class StopUpdate(BaseModel):
    city_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None
    order_index: int | None = None


class StopRead(StopBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    city_name: str | None = None
