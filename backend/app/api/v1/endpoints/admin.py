from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin, get_db
from app.models.user import User
from app.schemas.admin import (
    AdminActivityPopular,
    AdminCityPopular,
    AdminOverview,
    AdminTripStats,
    AdminUsersResponse,
)
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/overview", response_model=AdminOverview)
def get_overview(
    db: Session = Depends(get_db),
    _current_admin: User = Depends(get_current_admin),
) -> AdminOverview:
    return AdminService.get_overview(db)


@router.get("/users", response_model=AdminUsersResponse)
def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = None,
    db: Session = Depends(get_db),
    _current_admin: User = Depends(get_current_admin),
) -> AdminUsersResponse:
    return AdminService.get_user_list(db, page, page_size, q)


@router.get("/stats/trips", response_model=AdminTripStats)
def get_trip_stats(
    db: Session = Depends(get_db),
    _current_admin: User = Depends(get_current_admin),
) -> AdminTripStats:
    return AdminService.get_trip_stats(db)


@router.get("/stats/cities", response_model=list[AdminCityPopular])
def get_popular_cities(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(get_current_admin),
) -> list[AdminCityPopular]:
    return AdminService.get_popular_cities(db, limit)


@router.get("/stats/activities", response_model=list[AdminActivityPopular])
def get_popular_activities(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _current_admin: User = Depends(get_current_admin),
) -> list[AdminActivityPopular]:
    return AdminService.get_popular_activities(db, limit)
