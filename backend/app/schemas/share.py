from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.trip import TripBudgetResponse
from app.schemas.trip_activity import TripActivityRead


class ShareAuthor(BaseModel):
    first_name: str
    last_name: str
    name: str


class PublicShareStop(BaseModel):
    id: int
    city_id: int
    city_name: str
    city_country: str | None = None
    city_image_url: str | None = None
    start_date: date
    end_date: date
    order_index: int
    activities: list[TripActivityRead] = Field(default_factory=list)


class PublicShareResponse(BaseModel):
    slug: str
    trip_id: int
    name: str
    description: str | None = None
    cover_photo: str | None = None
    start_date: date
    end_date: date
    budget_cap: Decimal | None = None
    author: ShareAuthor
    stops: list[PublicShareStop] = Field(default_factory=list)
    budget: TripBudgetResponse
    created_at: datetime


class ShareCardRead(BaseModel):
    id: int
    slug: str
    trip_name: str
    description: str | None = None
    cover_photo: str | None = None
    start_date: date
    end_date: date
    budget_cap: Decimal | None = None
    author_name: str
    author_initials: str
    destination: str
    highlights: list[str] = Field(default_factory=list)
    stop_count: int
    activity_count: int
    like_count: int
    liked_by_me: bool
    created_at: datetime


class ShareLikeResponse(BaseModel):
    like_count: int
    liked_by_me: bool


class ShareCopyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    trip_id: int
    name: str
