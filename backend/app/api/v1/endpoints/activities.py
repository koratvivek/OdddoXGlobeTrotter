from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityRead, ActivityUpdate
from app.schemas.common import PaginatedResponse
from app.services.activities import ActivityService

router = APIRouter(prefix="/activities", tags=["activities"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("", response_model=PaginatedResponse[ActivityRead])
def list_activities(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    city_id: int | None = None,
    q: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> PaginatedResponse[ActivityRead]:
    return ActivityService.list_activities(db, page, page_size, city_id, q, category)


@router.post("", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
def create_activity(_payload: ActivityCreate) -> ActivityRead:
    _not_implemented()


@router.get("/{activity_id}", response_model=ActivityRead)
def get_activity(
    activity_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
) -> ActivityRead:
    activity = ActivityService.get_activity(db, activity_id)
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")
    return activity


@router.patch("/{activity_id}", response_model=ActivityRead)
def update_activity(activity_id: int, _payload: ActivityUpdate) -> ActivityRead:
    _not_implemented()


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(activity_id: int) -> None:
    _not_implemented()
