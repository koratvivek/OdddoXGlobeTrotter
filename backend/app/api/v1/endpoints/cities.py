from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.city import CityCreate, CityRead, CityUpdate
from app.schemas.common import PaginatedResponse
from app.services.cities import CityService

router = APIRouter(prefix="/cities", tags=["cities"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("", response_model=PaginatedResponse[CityRead])
def list_cities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> PaginatedResponse[CityRead]:
    return CityService.list_cities(db, page, page_size, q)


@router.post("", response_model=CityRead, status_code=status.HTTP_201_CREATED)
def create_city(_payload: CityCreate) -> CityRead:
    _not_implemented()


@router.get("/{city_id}", response_model=CityRead)
def get_city(
    city_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> CityRead:
    city = CityService.get_city(db, city_id)
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")
    return city


@router.patch("/{city_id}", response_model=CityRead)
def update_city(city_id: int, _payload: CityUpdate) -> CityRead:
    _not_implemented()


@router.delete("/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_city(city_id: int) -> None:
    _not_implemented()
