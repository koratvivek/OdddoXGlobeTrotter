from datetime import datetime
from pydantic import BaseModel


class AdminOverview(BaseModel):
    total_users: int
    total_trips: int
    total_cities: int
    total_activities: int
    public_trips: int


class AdminUserRow(BaseModel):
    id: int
    name: str
    email: str
    is_admin: bool
    created_at: datetime
    trip_count: int


class AdminUsersResponse(BaseModel):
    items: list[AdminUserRow]
    page: int
    page_size: int
    total: int
    total_pages: int


class AdminTripStats(BaseModel):
    total: int
    completed: int
    upcoming: int
    ongoing: int
    public: int
    avg_duration_days: float


class AdminCityPopular(BaseModel):
    city_id: int
    name: str
    country: str
    stop_count: int


class AdminActivityPopular(BaseModel):
    activity_id: int
    name: str
    category: str
    city_name: str
    usage_count: int
