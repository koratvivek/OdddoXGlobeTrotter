"""Stop service."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.city import City
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.user import User
from app.schemas.common import PaginatedResponse, paginate
from app.schemas.stop import StopCreate, StopRead


def _stop_to_read(stop: Stop) -> StopRead:
    return StopRead(
        id=stop.id,
        trip_id=stop.trip_id,
        city_id=stop.city_id,
        start_date=stop.start_date,
        end_date=stop.end_date,
        order_index=stop.order_index,
        city_name=stop.city.name if stop.city else None,
    )


class StopService:
    @staticmethod
    def _get_owned_trip(db: Session, trip_id: int, user: User) -> Trip:
        trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
        return trip

    @staticmethod
    def list_stops(
        db: Session,
        user: User,
        trip_id: int,
        page: int,
        page_size: int,
    ) -> PaginatedResponse[StopRead]:
        StopService._get_owned_trip(db, trip_id, user)
        query = (
            db.query(Stop)
            .options(joinedload(Stop.city))
            .filter(Stop.trip_id == trip_id)
            .order_by(Stop.order_index.asc())
        )
        items, total, total_pages = paginate(query, page, page_size)
        return PaginatedResponse(
            items=[_stop_to_read(s) for s in items],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def create_stop(db: Session, user: User, payload: StopCreate) -> StopRead:
        StopService._get_owned_trip(db, payload.trip_id, user)
        city = db.get(City, payload.city_id)
        if not city:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")
        if payload.end_date < payload.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stop end date must be on or after start date.",
            )
        stop = Stop(**payload.model_dump())
        db.add(stop)
        db.commit()
        db.refresh(stop)
        stop = (
            db.query(Stop)
            .options(joinedload(Stop.city))
            .filter(Stop.id == stop.id)
            .first()
        )
        return _stop_to_read(stop)
