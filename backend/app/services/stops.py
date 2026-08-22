"""Stop service."""

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.city import City
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.trip_activity import TripActivity
from app.models.user import User
from app.schemas.common import PaginatedResponse, paginate
from app.schemas.stop import StopCreate, StopRead, StopUpdate


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
    def _get_owned_stop(db: Session, stop_id: int, user: User) -> Stop:
        stop = (
            db.query(Stop)
            .options(joinedload(Stop.city))
            .join(Trip, Stop.trip_id == Trip.id)
            .filter(Stop.id == stop_id, Trip.user_id == user.id)
            .first()
        )
        if not stop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found.")
        return stop

    @staticmethod
    def _reindex_stops(db: Session, trip_id: int) -> None:
        stops = (
            db.query(Stop)
            .filter(Stop.trip_id == trip_id)
            .order_by(Stop.order_index.asc())
            .all()
        )
        for idx, stop in enumerate(stops):
            stop.order_index = idx

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
        trip = StopService._get_owned_trip(db, payload.trip_id, user)
        city = db.get(City, payload.city_id)
        if not city:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")
        if payload.end_date < payload.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stop end date must be on or after start date.",
            )
        if payload.start_date < trip.start_date or payload.end_date > trip.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stop dates must fall within the trip date range.",
            )

        order_index = payload.order_index
        if order_index is None:
            max_index = (
                db.query(func.max(Stop.order_index))
                .filter(Stop.trip_id == payload.trip_id)
                .scalar()
            )
            order_index = (max_index if max_index is not None else -1) + 1

        stop = Stop(
            trip_id=payload.trip_id,
            city_id=payload.city_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            order_index=order_index,
        )
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

    @staticmethod
    def get_stop(db: Session, user: User, stop_id: int) -> StopRead:
        stop = StopService._get_owned_stop(db, stop_id, user)
        return _stop_to_read(stop)

    @staticmethod
    def update_stop(db: Session, user: User, stop_id: int, payload: StopUpdate) -> StopRead:
        stop = StopService._get_owned_stop(db, stop_id, user)
        trip = db.get(Trip, stop.trip_id)

        if payload.city_id is not None:
            city = db.get(City, payload.city_id)
            if not city:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")
            if payload.city_id != stop.city_id:
                db.query(TripActivity).filter(TripActivity.stop_id == stop.id).delete(
                    synchronize_session=False
                )
            stop.city_id = payload.city_id

        if payload.start_date is not None:
            stop.start_date = payload.start_date
        if payload.end_date is not None:
            stop.end_date = payload.end_date
        if payload.order_index is not None:
            stop.order_index = payload.order_index

        if stop.end_date < stop.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stop end date must be on or after start date.",
            )
        if stop.start_date < trip.start_date or stop.end_date > trip.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stop dates must fall within the trip date range.",
            )

        db.commit()
        db.refresh(stop)
        stop = (
            db.query(Stop)
            .options(joinedload(Stop.city))
            .filter(Stop.id == stop.id)
            .first()
        )
        return _stop_to_read(stop)

    @staticmethod
    def delete_stop(db: Session, user: User, stop_id: int) -> None:
        stop = StopService._get_owned_stop(db, stop_id, user)
        trip_id = stop.trip_id
        db.delete(stop)
        db.commit()
        StopService._reindex_stops(db, trip_id)
        db.commit()
