from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: str | None = None
    city: str | None = None
    country: str | None = None
    bio: str | None = None
    photo: str | None = None
    language_pref: str = "en"


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=50)
    city: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    bio: str | None = None
    photo: str | None = Field(default=None, max_length=512)
    language_pref: str | None = None


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_admin: bool
    created_at: datetime
    trip_count: int = 0
