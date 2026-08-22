from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TripShareBase(BaseModel):
    trip_id: int
    public_slug: str = Field(min_length=1, max_length=64)


class TripShareCreate(BaseModel):
    trip_id: int


class TripShareRead(TripShareBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
