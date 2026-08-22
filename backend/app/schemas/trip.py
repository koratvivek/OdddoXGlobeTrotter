from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class TripBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    start_date: date
    end_date: date
    description: str | None = None
    cover_photo: str | None = None
    is_public: bool = False
    budget_cap: Decimal | None = None


class TripCreate(TripBase):
    pass


class TripUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    cover_photo: str | None = None
    is_public: bool | None = None
    budget_cap: Decimal | None = None


class TripRead(TripBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
