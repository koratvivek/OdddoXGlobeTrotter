from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.stop import StopCreate, StopRead, StopUpdate
from app.services.stops import StopService

router = APIRouter(prefix="/stops", tags=["stops"])


@router.get("", response_model=PaginatedResponse[StopRead])
def list_stops(
    trip_id: int = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[StopRead]:
    return StopService.list_stops(db, current_user, trip_id, page, page_size)


@router.post("", response_model=StopRead, status_code=status.HTTP_201_CREATED)
def create_stop(
    payload: StopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StopRead:
    return StopService.create_stop(db, current_user, payload)


@router.get("/{stop_id}", response_model=StopRead)
def get_stop(
    stop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StopRead:
    return StopService.get_stop(db, current_user, stop_id)


@router.patch("/{stop_id}", response_model=StopRead)
def update_stop(
    stop_id: int,
    payload: StopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StopRead:
    return StopService.update_stop(db, current_user, stop_id, payload)


@router.delete("/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stop(
    stop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    StopService.delete_stop(db, current_user, stop_id)
