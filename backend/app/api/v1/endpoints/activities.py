from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.models.activity import Activity
from app.schemas.activity import ActivityCreate, ActivityRead, ActivityUpdate

router = APIRouter(prefix="/activities", tags=["activities"])


def _not_implemented() -> None:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Endpoint not implemented yet.",
    )


@router.get("", response_model=list[ActivityRead])
def list_activities(db: Session = Depends(get_db)) -> list[ActivityRead]:
    return db.query(Activity).all()


@router.post("", response_model=ActivityRead, status_code=status.HTTP_201_CREATED)
def create_activity(_payload: ActivityCreate) -> ActivityRead:
    _not_implemented()


@router.get("/{activity_id}", response_model=ActivityRead)
def get_activity(activity_id: int) -> ActivityRead:
    _not_implemented()


@router.patch("/{activity_id}", response_model=ActivityRead)
def update_activity(activity_id: int, _payload: ActivityUpdate) -> ActivityRead:
    _not_implemented()


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(activity_id: int) -> None:
    _not_implemented()
