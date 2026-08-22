"""Admin service."""

from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.city import City
from app.models.stop import Stop
from app.models.trip import Trip
from app.models.trip_activity import TripActivity
from app.models.user import User
from app.schemas.admin import (
    AdminActivityPopular,
    AdminCityPopular,
    AdminOverview,
    AdminTripStats,
    AdminUserRow,
    AdminUsersResponse,
)
from app.schemas.common import paginate


class AdminService:
    @staticmethod
    def get_overview(db: Session) -> AdminOverview:
        total_users = db.query(User).count()
        total_trips = db.query(Trip).count()
        total_cities = db.query(City).count()
        total_activities = db.query(Activity).count()
        public_trips = db.query(Trip).filter(Trip.is_public == True).count()

        return AdminOverview(
            total_users=total_users,
            total_trips=total_trips,
            total_cities=total_cities,
            total_activities=total_activities,
            public_trips=public_trips,
        )

    @staticmethod
    def get_user_list(db: Session, page: int, page_size: int, q: str | None = None) -> AdminUsersResponse:
        query = db.query(
            User,
            func.count(Trip.id).label("trip_count")
        ).outerjoin(Trip, User.id == Trip.user_id).group_by(User.id)

        if q:
            like = f"%{q}%"
            query = query.filter(
                (User.name.ilike(like)) | (User.email.ilike(like))
            )

        query = query.order_by(User.created_at.desc())

        total = query.count()
        total_pages = (total + page_size - 1) // page_size if total else 0
        items = query.offset((page - 1) * page_size).limit(page_size).all()

        rows = []
        for user, trip_count in items:
            rows.append(
                AdminUserRow(
                    id=user.id,
                    name=user.name,
                    email=user.email,
                    is_admin=user.is_admin,
                    created_at=user.created_at,
                    trip_count=trip_count,
                )
            )

        return AdminUsersResponse(
            items=rows,
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def get_trip_stats(db: Session) -> AdminTripStats:
        today = date.today()
        total = db.query(Trip).count()
        completed = db.query(Trip).filter(Trip.end_date < today).count()
        upcoming = db.query(Trip).filter(Trip.start_date > today).count()
        ongoing = db.query(Trip).filter(Trip.start_date <= today, Trip.end_date >= today).count()
        public = db.query(Trip).filter(Trip.is_public == True).count()
        
        # approximate avg duration
        avg_res = db.query(func.avg(Trip.end_date - Trip.start_date)).scalar()
        # postgres returns float/Decimal for avg of interval/integer depending on dialect, let's just do a rough extract
        # or we can do it with func.extract
        # A simpler cross-db way is sum of duration days / count
        
        # fallback to python compute if total is small or use simple query:
        # let's just use func.avg. In PG, avg(date - date) gives integer days.
        avg_duration_days = float(avg_res) if avg_res is not None else 0.0

        return AdminTripStats(
            total=total,
            completed=completed,
            upcoming=upcoming,
            ongoing=ongoing,
            public=public,
            avg_duration_days=avg_duration_days,
        )

    @staticmethod
    def get_popular_cities(db: Session, limit: int = 10) -> list[AdminCityPopular]:
        rows = (
            db.query(City, func.count(Stop.id).label("stop_count"))
            .join(Stop, City.id == Stop.city_id)
            .group_by(City.id)
            .order_by(func.count(Stop.id).desc())
            .limit(limit)
            .all()
        )
        return [
            AdminCityPopular(
                city_id=city.id,
                name=city.name,
                country=city.country,
                stop_count=stop_count,
            )
            for city, stop_count in rows
        ]

    @staticmethod
    def get_popular_activities(db: Session, limit: int = 10) -> list[AdminActivityPopular]:
        rows = (
            db.query(Activity, City.name.label("city_name"), func.count(TripActivity.id).label("usage_count"))
            .join(TripActivity, Activity.id == TripActivity.activity_id)
            .join(City, Activity.city_id == City.id)
            .group_by(Activity.id, City.name)
            .order_by(func.count(TripActivity.id).desc())
            .limit(limit)
            .all()
        )
        return [
            AdminActivityPopular(
                activity_id=activity.id,
                name=activity.name,
                category=activity.category,
                city_name=city_name,
                usage_count=usage_count,
            )
            for activity, city_name, usage_count in rows
        ]
