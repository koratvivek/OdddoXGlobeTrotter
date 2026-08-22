"""Trip activity service."""

from datetime import time
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.activity import Activity
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.trip_activity import TripActivity
from app.models.user import User
from app.schemas.common import PaginatedResponse, paginate
from app.schemas.trip_activity import TripActivityCreate, TripActivityRead, TripActivityUpdate


def _effective_cost(ta: TripActivity) -> Decimal:
    if ta.cost_override is not None:
        return ta.cost_override
    if ta.activity:
        return ta.activity.cost
    return Decimal("0")


def _trip_activity_to_read(ta: TripActivity) -> TripActivityRead:
    activity = ta.activity
    cost = activity.cost if activity else None
    return TripActivityRead(
        id=ta.id,
        stop_id=ta.stop_id,
        activity_id=ta.activity_id,
        scheduled_date=ta.scheduled_date,
        scheduled_time=ta.scheduled_time,
        cost_override=ta.cost_override,
        activity_name=activity.name if activity else None,
        category=activity.category if activity else None,
        duration=activity.duration if activity else None,
        cost=cost,
        effective_cost=_effective_cost(ta),
    )


class TripActivityService:
    @staticmethod
    def _get_owned_stop(db: Session, stop_id: int, user: User) -> Stop:
        stop = (
            db.query(Stop)
            .join(Trip, Stop.trip_id == Trip.id)
            .filter(Stop.id == stop_id, Trip.user_id == user.id)
            .first()
        )
        if not stop:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found.")
        return stop

    @staticmethod
    def _get_owned_trip_activity(db: Session, trip_activity_id: int, user: User) -> TripActivity:
        ta = (
            db.query(TripActivity)
            .options(joinedload(TripActivity.activity))
            .join(Stop, TripActivity.stop_id == Stop.id)
            .join(Trip, Stop.trip_id == Trip.id)
            .filter(TripActivity.id == trip_activity_id, Trip.user_id == user.id)
            .first()
        )
        if not ta:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Trip activity not found."
            )
        return ta

    @staticmethod
    def _validate_date_in_stop(stop: Stop, scheduled_date) -> None:
        if scheduled_date < stop.start_date or scheduled_date > stop.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scheduled date must be within the stop date range.",
            )

    @staticmethod
    def list_trip_activities(
        db: Session,
        user: User,
        stop_id: int,
        page: int,
        page_size: int,
    ) -> PaginatedResponse[TripActivityRead]:
        TripActivityService._get_owned_stop(db, stop_id, user)
        query = (
            db.query(TripActivity)
            .options(joinedload(TripActivity.activity))
            .filter(TripActivity.stop_id == stop_id)
            .order_by(
                TripActivity.scheduled_date.asc(),
                TripActivity.scheduled_time.asc().nulls_last(),
                TripActivity.id.asc(),
            )
        )
        items, total, total_pages = paginate(query, page, page_size)
        return PaginatedResponse(
            items=[_trip_activity_to_read(ta) for ta in items],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def create_trip_activity(
        db: Session, user: User, payload: TripActivityCreate
    ) -> TripActivityRead:
        stop = TripActivityService._get_owned_stop(db, payload.stop_id, user)
        activity = db.get(Activity, payload.activity_id)
        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found."
            )
        if activity.city_id != stop.city_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Activity does not belong to this stop's city.",
            )

        scheduled_date = payload.scheduled_date or stop.start_date
        TripActivityService._validate_date_in_stop(stop, scheduled_date)
        scheduled_time = payload.scheduled_time or time(10, 0)

        ta = TripActivity(
            stop_id=payload.stop_id,
            activity_id=payload.activity_id,
            scheduled_date=scheduled_date,
            scheduled_time=scheduled_time,
            cost_override=payload.cost_override,
        )
        db.add(ta)
        db.commit()
        db.refresh(ta)
        ta = (
            db.query(TripActivity)
            .options(joinedload(TripActivity.activity))
            .filter(TripActivity.id == ta.id)
            .first()
        )
        return _trip_activity_to_read(ta)

    @staticmethod
    def get_trip_activity(db: Session, user: User, trip_activity_id: int) -> TripActivityRead:
        ta = TripActivityService._get_owned_trip_activity(db, trip_activity_id, user)
        return _trip_activity_to_read(ta)

    @staticmethod
    def update_trip_activity(
        db: Session, user: User, trip_activity_id: int, payload: TripActivityUpdate
    ) -> TripActivityRead:
        ta = TripActivityService._get_owned_trip_activity(db, trip_activity_id, user)
        stop = db.get(Stop, ta.stop_id)

        if payload.activity_id is not None:
            activity = db.get(Activity, payload.activity_id)
            if not activity:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found."
                )
            if activity.city_id != stop.city_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Activity does not belong to this stop's city.",
                )
            ta.activity_id = payload.activity_id

        if payload.scheduled_date is not None:
            TripActivityService._validate_date_in_stop(stop, payload.scheduled_date)
            ta.scheduled_date = payload.scheduled_date
        if payload.scheduled_time is not None:
            ta.scheduled_time = payload.scheduled_time
        if "cost_override" in payload.model_fields_set:
            ta.cost_override = payload.cost_override

        db.commit()
        db.refresh(ta)
        ta = (
            db.query(TripActivity)
            .options(joinedload(TripActivity.activity))
            .filter(TripActivity.id == ta.id)
            .first()
        )
        return _trip_activity_to_read(ta)

    @staticmethod
    def delete_trip_activity(db: Session, user: User, trip_activity_id: int) -> None:
        ta = TripActivityService._get_owned_trip_activity(db, trip_activity_id, user)
        db.delete(ta)
        db.commit()
