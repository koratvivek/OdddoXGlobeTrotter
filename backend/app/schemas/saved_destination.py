from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SavedDestinationCreate(BaseModel):
    city_id: int


class SavedDestinationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    city_id: int
    city_name: str
    country: str
    image_url: str | None = None
    saved_at: datetime
