"""Share service."""

import secrets
import string
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload

from app.models.city import City
from app.models.share_like import ShareLike
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.trip_activity import TripActivity
from app.models.trip_share import TripShare
from app.models.user import User
from app.schemas.common import PaginatedResponse, paginate
from app.schemas.share import (
    PublicShareResponse,
    PublicShareStop,
    ShareAuthor,
    ShareCardRead,
    ShareCopyResponse,
    ShareLikeResponse,
)
from app.schemas.trip_share import TripShareRead
from app.services.budget import BudgetService
from app.services.trip_activities import _trip_activity_to_read
from app.services.trips import TripService


def _author_initials(user: User) -> str:
    first = (user.first_name or "")[:1].upper()
    last = (user.last_name or "")[:1].upper()
    return f"{first}{last}" or "?"


def _generate_slug(db: Session, length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    for _ in range(20):
        slug = "".join(secrets.choice(alphabet) for _ in range(length))
        exists = db.query(TripShare).filter(TripShare.public_slug == slug).first()
        if not exists:
            return slug
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not generate unique share slug.",
    )


def _share_to_read(share: TripShare) -> TripShareRead:
    return TripShareRead(
        id=share.id,
        trip_id=share.trip_id,
        public_slug=share.public_slug,
        created_at=share.created_at,
    )


def _load_public_trip(db: Session, slug: str) -> tuple[TripShare, Trip]:
    share = (
        db.query(TripShare)
        .join(Trip, TripShare.trip_id == Trip.id)
        .filter(TripShare.public_slug == slug, Trip.is_public.is_(True))
        .options(
            joinedload(TripShare.trip).joinedload(Trip.user),
            joinedload(TripShare.trip)
            .joinedload(Trip.stops)
            .joinedload(Stop.city),
            joinedload(TripShare.trip)
            .joinedload(Trip.stops)
            .joinedload(Stop.trip_activities)
            .joinedload(TripActivity.activity),
        )
        .first()
    )
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found.")
    return share, share.trip


def _build_public_share(db: Session, share: TripShare, trip: Trip) -> PublicShareResponse:
    stops = sorted(trip.stops, key=lambda s: s.order_index)
    public_stops: list[PublicShareStop] = []
    for stop in stops:
        activities = sorted(
            stop.trip_activities,
            key=lambda ta: (ta.scheduled_date, ta.scheduled_time or ""),
        )
        public_stops.append(
            PublicShareStop(
                id=stop.id,
                city_id=stop.city_id,
                city_name=stop.city.name if stop.city else "",
                city_country=stop.city.country if stop.city else None,
                city_image_url=stop.city.image_url if stop.city else None,
                start_date=stop.start_date,
                end_date=stop.end_date,
                order_index=stop.order_index,
                activities=[_trip_activity_to_read(ta) for ta in activities],
            )
        )

    author = trip.user
    budget = BudgetService._calculate_from_trip(trip)

    return PublicShareResponse(
        slug=share.public_slug,
        trip_id=trip.id,
        name=trip.name,
        description=trip.description,
        cover_photo=trip.cover_photo,
        start_date=trip.start_date,
        end_date=trip.end_date,
        budget_cap=trip.budget_cap,
        author=ShareAuthor(
            first_name=author.first_name,
            last_name=author.last_name,
            name=author.name,
        ),
        stops=public_stops,
        budget=budget,
        created_at=share.created_at,
    )


def _destination_from_stops(stops: list[Stop]) -> str:
    names = []
    for stop in sorted(stops, key=lambda s: s.order_index):
        if stop.city and stop.city.name:
            names.append(stop.city.name)
    return " · ".join(names)


def _highlights_from_trip(trip: Trip) -> list[str]:
    names: list[str] = []
    for stop in sorted(trip.stops, key=lambda s: s.order_index):
        for ta in sorted(stop.trip_activities, key=lambda a: a.scheduled_date):
            if ta.activity and ta.activity.name and ta.activity.name not in names:
                names.append(ta.activity.name)
            if len(names) >= 3:
                return names
    return names


def _like_count_subquery(db: Session):
    return (
        db.query(
            ShareLike.share_id,
            func.count(ShareLike.id).label("like_count"),
        )
        .group_by(ShareLike.share_id)
        .subquery()
    )


class ShareService:
    @staticmethod
    def create_share(db: Session, user: User, trip_id: int) -> TripShareRead:
        trip = TripService.get_owned_trip(db, trip_id, user)
        existing = db.query(TripShare).filter(TripShare.trip_id == trip.id).first()
        if existing:
            if not trip.is_public:
                trip.is_public = True
                db.commit()
            return _share_to_read(existing)

        slug = _generate_slug(db)
        trip.is_public = True
        share = TripShare(trip_id=trip.id, public_slug=slug)
        db.add(share)
        db.commit()
        db.refresh(share)
        return _share_to_read(share)

    @staticmethod
    def revoke_share(db: Session, user: User, share_id: int) -> None:
        share = (
            db.query(TripShare)
            .options(joinedload(TripShare.trip))
            .filter(TripShare.id == share_id)
            .first()
        )
        if not share or share.trip.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found.")
        share.trip.is_public = False
        db.delete(share)
        db.commit()

    @staticmethod
    def get_public_share(db: Session, slug: str) -> PublicShareResponse:
        share, trip = _load_public_trip(db, slug)
        return _build_public_share(db, share, trip)

    @staticmethod
    def list_shares(
        db: Session,
        user: User,
        page: int,
        page_size: int,
        q: str | None = None,
        sort: str = "popular",
    ) -> PaginatedResponse[ShareCardRead]:
        like_counts = _like_count_subquery(db)
        like_count_col = func.coalesce(like_counts.c.like_count, 0)

        query = (
            db.query(TripShare, like_count_col.label("like_count"))
            .join(Trip, TripShare.trip_id == Trip.id)
            .join(User, Trip.user_id == User.id)
            .outerjoin(like_counts, like_counts.c.share_id == TripShare.id)
            .options(
                joinedload(TripShare.trip)
                .joinedload(Trip.stops)
                .joinedload(Stop.city),
                joinedload(TripShare.trip)
                .joinedload(Trip.stops)
                .joinedload(Stop.trip_activities)
                .joinedload(TripActivity.activity),
                joinedload(TripShare.trip).joinedload(Trip.user),
            )
            .filter(Trip.is_public.is_(True))
        )

        if q:
            like = f"%{q}%"
            query = (
                query.outerjoin(Stop, Stop.trip_id == Trip.id)
                .outerjoin(City, Stop.city_id == City.id)
                .filter(
                    Trip.name.ilike(like)
                    | Trip.description.ilike(like)
                    | User.name.ilike(like)
                    | User.first_name.ilike(like)
                    | User.last_name.ilike(like)
                    | City.name.ilike(like)
                )
                .distinct()
            )

        if sort == "recent":
            query = query.order_by(TripShare.created_at.desc())
        elif sort == "budget":
            query = query.order_by(
                case((Trip.budget_cap.is_(None), 1), else_=0),
                Trip.budget_cap.asc(),
            )
        else:
            query = query.order_by(like_count_col.desc(), TripShare.created_at.desc())

        rows, total, total_pages = paginate(query, page, page_size)

        share_ids = [row[0].id for row in rows]
        liked_ids: set[int] = set()
        if share_ids:
            liked_ids = {
                row.share_id
                for row in db.query(ShareLike.share_id)
                .filter(ShareLike.user_id == user.id, ShareLike.share_id.in_(share_ids))
                .all()
            }

        items: list[ShareCardRead] = []
        for share, like_count in rows:
            trip = share.trip
            activity_count = sum(len(s.trip_activities) for s in trip.stops)
            items.append(
                ShareCardRead(
                    id=share.id,
                    slug=share.public_slug,
                    trip_name=trip.name,
                    description=trip.description,
                    cover_photo=trip.cover_photo,
                    start_date=trip.start_date,
                    end_date=trip.end_date,
                    budget_cap=trip.budget_cap,
                    author_name=trip.user.name,
                    author_initials=_author_initials(trip.user),
                    destination=_destination_from_stops(trip.stops),
                    highlights=_highlights_from_trip(trip),
                    stop_count=len(trip.stops),
                    activity_count=activity_count,
                    like_count=int(like_count or 0),
                    liked_by_me=share.id in liked_ids,
                    created_at=share.created_at,
                )
            )

        return PaginatedResponse(
            items=items,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def copy_trip(db: Session, user: User, slug: str) -> ShareCopyResponse:
        share, source_trip = _load_public_trip(db, slug)
        _ = share

        today = date.today()
        new_start = today + timedelta(days=30)
        date_delta = new_start - source_trip.start_date

        new_trip = Trip(
            user_id=user.id,
            name=f"{source_trip.name} (copy)",
            start_date=source_trip.start_date + date_delta,
            end_date=source_trip.end_date + date_delta,
            description=source_trip.description,
            cover_photo=source_trip.cover_photo,
            is_public=False,
            budget_cap=source_trip.budget_cap,
        )
        db.add(new_trip)
        db.flush()

        stop_id_map: dict[int, int] = {}
        for stop in sorted(source_trip.stops, key=lambda s: s.order_index):
            new_stop = Stop(
                trip_id=new_trip.id,
                city_id=stop.city_id,
                start_date=stop.start_date + date_delta,
                end_date=stop.end_date + date_delta,
                order_index=stop.order_index,
            )
            db.add(new_stop)
            db.flush()
            stop_id_map[stop.id] = new_stop.id

        for stop in source_trip.stops:
            new_stop_id = stop_id_map[stop.id]
            for ta in stop.trip_activities:
                db.add(
                    TripActivity(
                        stop_id=new_stop_id,
                        activity_id=ta.activity_id,
                        scheduled_date=ta.scheduled_date + date_delta,
                        scheduled_time=ta.scheduled_time,
                        cost_override=ta.cost_override,
                    )
                )

        db.commit()
        db.refresh(new_trip)
        return ShareCopyResponse(trip_id=new_trip.id, name=new_trip.name)

    @staticmethod
    def like_share(db: Session, user: User, share_id: int) -> ShareLikeResponse:
        share = db.query(TripShare).filter(TripShare.id == share_id).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found.")

        existing = (
            db.query(ShareLike)
            .filter(ShareLike.share_id == share_id, ShareLike.user_id == user.id)
            .first()
        )
        if not existing:
            db.add(ShareLike(share_id=share_id, user_id=user.id))
            db.commit()

        like_count = (
            db.query(func.count(ShareLike.id))
            .filter(ShareLike.share_id == share_id)
            .scalar()
            or 0
        )
        return ShareLikeResponse(like_count=like_count, liked_by_me=True)

    @staticmethod
    def unlike_share(db: Session, user: User, share_id: int) -> ShareLikeResponse:
        share = db.query(TripShare).filter(TripShare.id == share_id).first()
        if not share:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share not found.")

        db.query(ShareLike).filter(
            ShareLike.share_id == share_id, ShareLike.user_id == user.id
        ).delete()
        db.commit()

        like_count = (
            db.query(func.count(ShareLike.id))
            .filter(ShareLike.share_id == share_id)
            .scalar()
            or 0
        )
        return ShareLikeResponse(like_count=like_count, liked_by_me=False)
