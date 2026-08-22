from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ActivityBase(BaseModel):
    city_id: int
    name: str = Field(min_length=1, max_length=255)
    category: str = Field(min_length=1, max_length=100)
    cost: Decimal
    duration: int = Field(ge=1)
    description: str | None = None
    image_url: str | None = None


class ActivityCreate(ActivityBase):
    pass


class ActivityUpdate(BaseModel):
    city_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    cost: Decimal | None = None
    duration: int | None = Field(default=None, ge=1)
    description: str | None = None
    image_url: str | None = None


class ActivityRead(ActivityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
