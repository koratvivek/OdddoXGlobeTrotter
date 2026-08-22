"""Activity catalog service."""

from sqlalchemy.orm import Session

from app.models.activity import Activity
from app.models.city import City
from app.schemas.activity import ActivityRead
from app.schemas.common import PaginatedResponse, paginate


class ActivityService:
    @staticmethod
    def list_activities(
        db: Session,
        page: int,
        page_size: int,
        city_id: int | None = None,
        q: str | None = None,
        category: str | None = None,
        country: str | None = None,
    ) -> PaginatedResponse[ActivityRead]:
        query = db.query(Activity)

        if city_id is not None:
            query = query.filter(Activity.city_id == city_id)
        if q:
            like = f"%{q}%"
            query = query.filter(Activity.name.ilike(like))
        if category:
            query = query.filter(Activity.category == category)
        if country:
            query = query.join(City, Activity.city_id == City.id).filter(City.country == country)

        query = query.order_by(Activity.name.asc())
        items, total, total_pages = paginate(query, page, page_size)
        return PaginatedResponse(
            items=[ActivityRead.model_validate(a) for a in items],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )

    @staticmethod
    def get_activity(db: Session, activity_id: int) -> ActivityRead | None:
        activity = db.get(Activity, activity_id)
        if not activity:
            return None
        return ActivityRead.model_validate(activity)
