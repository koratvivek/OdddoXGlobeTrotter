import math
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorResponse(BaseModel):
    detail: str


class MessageResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)


def paginate(query, page: int, page_size: int):
    total = query.count()
    total_pages = math.ceil(total / page_size) if total else 0
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total, total_pages
