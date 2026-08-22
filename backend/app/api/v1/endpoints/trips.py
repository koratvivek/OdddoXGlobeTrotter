from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.trip import TripCreate, TripRead, TripUpdate
from app.services.trips import TripService

router = APIRouter(prefix="/trips", tags=["trips"])


@router.get("", response_model=PaginatedResponse[TripRead])
def list_trips(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    status: str = Query("all", pattern="^(all|upcoming|ongoing|completed)$"),
    sort: str = Query("date", pattern="^(date|name|budget)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[TripRead]:
    return TripService.list_trips(db, current_user, page, page_size, q, status, sort)


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripRead:
    return TripService.create_trip(db, current_user, payload)


@router.get("/{trip_id}", response_model=TripRead)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripRead:
    return TripService.get_trip(db, trip_id, current_user)


@router.patch("/{trip_id}", response_model=TripRead)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripRead:
    return TripService.update_trip(db, trip_id, current_user, payload)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    TripService.delete_trip(db, trip_id, current_user)
