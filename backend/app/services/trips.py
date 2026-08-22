"""Trip service."""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import case
from sqlalchemy.orm import Session, joinedload, subqueryload

from app.models.stop import Stop
from app.models.trip import Trip
from app.models.user import User
from app.schemas.common import PaginatedResponse, paginate
from app.schemas.trip import TripCreate, TripRead, TripStopSummary, TripUpdate


def _validate_dates(start_date: date, end_date: date) -> None:
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be on or after start date.",
        )


def _trip_status_filter(query, status_filter: str, today: date):
    if status_filter == "completed":
        return query.filter(Trip.end_date < today)
    if status_filter == "upcoming":
        return query.filter(Trip.start_date > today)
    if status_filter == "ongoing":
        return query.filter(Trip.start_date <= today, Trip.end_date >= today)
    return query


def _trip_to_read(trip: Trip) -> TripRead:
    stops = sorted(trip.stops, key=lambda s: s.order_index)
    stop_summaries = [
        TripStopSummary(
            id=s.id,
            city_id=s.city_id,
            city_name=s.city.name if s.city else "",
            start_date=s.start_date,
            end_date=s.end_date,
            order_index=s.order_index,
        )
        for s in stops
    ]
    return TripRead(
        id=trip.id,
        user_id=trip.user_id,
        name=trip.name,
        start_date=trip.start_date,
        end_date=trip.end_date,
        description=trip.description,
        cover_photo=trip.cover_photo,
        is_public=trip.is_public,
        budget_cap=trip.budget_cap,
        created_at=trip.created_at,
        stop_count=len(stop_summaries),
        stops=stop_summaries,
    )


class TripService:
    @staticmethod
    def get_owned_trip(db: Session, trip_id: int, user: User) -> Trip:
        trip = (
            db.query(Trip)
            .options(joinedload(Trip.stops).joinedload(Stop.city))
            .filter(Trip.id == trip_id, Trip.user_id == user.id)
            .first()
        )
        if not trip:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
        return trip

    @staticmethod
    def list_trips(
        db: Session,
        user: User,
        page: int,
        page_size: int,
        q: str | None = None,
        status_filter: str = "all",
        sort: str = "date",
    ) -> PaginatedResponse[TripRead]:
        today = date.today()
        query = (
            db.query(Trip)
            .options(subqueryload(Trip.stops).joinedload(Stop.city))
            .filter(Trip.user_id == user.id)
        )

        if q:
            like = f"%{q}%"
            query = query.filter(Trip.name.ilike(like))

        query = _trip_status_filter(query, status_filter, today)

        if sort == "name":
            query = query.order_by(Trip.name.asc())
        elif sort == "budget":
            query = query.order_by(
                case((Trip.budget_cap.is_(None), 1), else_=0),
                Trip.budget_cap.desc(),
            )
        else:
            query = query.order_by(Trip.start_date.desc())

        items, total, total_pages = paginate(query, page, page_size)
        return PaginatedResponse(
            items=[_trip_to_read(t) for t in items],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def create_trip(db: Session, user: User, payload: TripCreate) -> TripRead:
        _validate_dates(payload.start_date, payload.end_date)
        trip = Trip(user_id=user.id, **payload.model_dump())
        db.add(trip)
        db.commit()
        db.refresh(trip)
        return _trip_to_read(
            db.query(Trip)
            .options(joinedload(Trip.stops).joinedload(Stop.city))
            .filter(Trip.id == trip.id)
            .first()
        )

    @staticmethod
    def get_trip(db: Session, trip_id: int, user: User) -> TripRead:
        trip = TripService.get_owned_trip(db, trip_id, user)
        return _trip_to_read(trip)

    @staticmethod
    def update_trip(db: Session, trip_id: int, user: User, payload: TripUpdate) -> TripRead:
        trip = TripService.get_owned_trip(db, trip_id, user)
        data = payload.model_dump(exclude_unset=True)
        start = data.get("start_date", trip.start_date)
        end = data.get("end_date", trip.end_date)
        _validate_dates(start, end)
        for key, value in data.items():
            setattr(trip, key, value)
        db.commit()
        db.refresh(trip)
        return _trip_to_read(trip)

    @staticmethod
    def delete_trip(db: Session, trip_id: int, user: User) -> None:
        trip = TripService.get_owned_trip(db, trip_id, user)
        db.delete(trip)
        db.commit()
