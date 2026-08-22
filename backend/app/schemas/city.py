from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CityBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    country: str = Field(min_length=1, max_length=255)
    cost_index: Decimal
    popularity_score: int = 0
    image_url: str | None = None


class CityCreate(CityBase):
    pass


class CityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    country: str | None = Field(default=None, min_length=1, max_length=255)
    cost_index: Decimal | None = None
    popularity_score: int | None = None
    image_url: str | None = None


class CityRead(CityBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
