from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.trip_activity import (
    TripActivityCreate,
    TripActivityRead,
    TripActivityUpdate,
)
from app.services.trip_activities import TripActivityService

router = APIRouter(prefix="/trip-activities", tags=["trip-activities"])


@router.get("", response_model=PaginatedResponse[TripActivityRead])
def list_trip_activities(
    stop_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[TripActivityRead]:
    return TripActivityService.list_trip_activities(
        db, current_user, stop_id, page, page_size
    )


@router.post("", response_model=TripActivityRead, status_code=status.HTTP_201_CREATED)
def create_trip_activity(
    payload: TripActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripActivityRead:
    return TripActivityService.create_trip_activity(db, current_user, payload)


@router.get("/{trip_activity_id}", response_model=TripActivityRead)
def get_trip_activity(
    trip_activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripActivityRead:
    return TripActivityService.get_trip_activity(db, current_user, trip_activity_id)


@router.patch("/{trip_activity_id}", response_model=TripActivityRead)
def update_trip_activity(
    trip_activity_id: int,
    payload: TripActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripActivityRead:
    return TripActivityService.update_trip_activity(
        db, current_user, trip_activity_id, payload
    )


@router.delete("/{trip_activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_activity(
    trip_activity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    TripActivityService.delete_trip_activity(db, current_user, trip_activity_id)
