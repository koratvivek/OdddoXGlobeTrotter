from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.share import PublicShareResponse, ShareCardRead, ShareCopyResponse, ShareLikeResponse
from app.schemas.trip_share import TripShareCreate, TripShareRead
from app.services.shares import ShareService

router = APIRouter(prefix="/shares", tags=["shares"])


@router.get("", response_model=PaginatedResponse[ShareCardRead])
def list_shares(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    sort: str = Query("popular", pattern="^(popular|recent|budget)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedResponse[ShareCardRead]:
    return ShareService.list_shares(db, current_user, page, page_size, q, sort)


@router.get("/public/{slug}", response_model=PublicShareResponse)
def get_share_by_slug(slug: str, db: Session = Depends(get_db)) -> PublicShareResponse:
    return ShareService.get_public_share(db, slug)


@router.post("/public/{slug}/copy", response_model=ShareCopyResponse, status_code=status.HTTP_201_CREATED)
def copy_shared_trip(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShareCopyResponse:
    return ShareService.copy_trip(db, current_user, slug)


@router.post("", response_model=TripShareRead, status_code=status.HTTP_201_CREATED)
def create_share(
    payload: TripShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripShareRead:
    return ShareService.create_share(db, current_user, payload.trip_id)


@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    ShareService.revoke_share(db, current_user, share_id)


@router.post("/{share_id}/like", response_model=ShareLikeResponse)
def like_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShareLikeResponse:
    return ShareService.like_share(db, current_user, share_id)


@router.delete("/{share_id}/like", response_model=ShareLikeResponse)
def unlike_share(
    share_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShareLikeResponse:
    return ShareService.unlike_share(db, current_user, share_id)
