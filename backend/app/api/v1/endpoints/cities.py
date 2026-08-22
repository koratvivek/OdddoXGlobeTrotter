from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.city import City
from app.schemas.city import CityCreate, CityRead, CityUpdate

router = APIRouter(prefix="/cities", tags=["cities"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("", response_model=list[CityRead])
def list_cities(db: Session = Depends(get_db)) -> list[CityRead]:
    return db.query(City).all()


@router.post("", response_model=CityRead, status_code=status.HTTP_201_CREATED)
def create_city(_payload: CityCreate) -> CityRead:
    _not_implemented()


@router.get("/{city_id}", response_model=CityRead)
def get_city(city_id: int) -> CityRead:
    _not_implemented()


@router.patch("/{city_id}", response_model=CityRead)
def update_city(city_id: int, _payload: CityUpdate) -> CityRead:
    _not_implemented()


@router.delete("/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_city(city_id: int) -> None:
    _not_implemented()
