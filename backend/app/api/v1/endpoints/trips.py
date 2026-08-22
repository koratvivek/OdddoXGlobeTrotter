from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.trip import TripBudgetResponse, TripCreate, TripRead, TripUpdate
from app.services.budget import BudgetService
from app.services.shares import ShareService
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
    trip = TripService.create_trip(db, current_user, payload)
    if payload.is_public:
        ShareService.create_share(db, current_user, trip.id)
        return TripService.get_trip(db, trip.id, current_user)
    return trip


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
    trip = TripService.update_trip(db, trip_id, current_user, payload)
    if payload.is_public is not None:
        ShareService.sync_public_flag(db, current_user, trip_id, payload.is_public)
        return TripService.get_trip(db, trip_id, current_user)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    TripService.delete_trip(db, trip_id, current_user)


@router.get("/{trip_id}/budget", response_model=TripBudgetResponse)
def get_trip_budget(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripBudgetResponse:
    return BudgetService.calculate_trip_cost(db, trip_id, current_user)
